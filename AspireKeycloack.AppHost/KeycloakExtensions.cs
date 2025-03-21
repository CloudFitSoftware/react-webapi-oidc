using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;

namespace AspireKeycloack.AppHost;

internal static class KeycloakContainerImageTags
{
    public const string Registry = "quay.io";

    public const string Image = "keycloak/keycloak";

    public const string Tag = "26.1.4";
}

public sealed class KeycloakResource(string name, ParameterResource? admin, ParameterResource adminPassword)
    : ContainerResource(ThrowIfNull(name)), IResourceWithServiceDiscovery
{
    private const string DefaultAdmin = "admin";
    internal const string PrimaryEndpointName = "tcp";

    /// <summary>
    ///     Gets the parameter that contains the Keycloak admin.
    /// </summary>
    private ParameterResource? AdminUserNameParameter { get; } = admin;

    internal ReferenceExpression AdminReference =>
        AdminUserNameParameter is not null
            ? ReferenceExpression.Create($"{AdminUserNameParameter}")
            : ReferenceExpression.Create($"{DefaultAdmin}");

    /// <summary>
    ///     Gets the parameter that contains the Keycloak admin password.
    /// </summary>
    public ParameterResource AdminPasswordParameter { get; } = ThrowIfNull(adminPassword);

    private static T ThrowIfNull<T>([NotNull] T? argument,
        [CallerArgumentExpression(nameof(argument))] string? paramName = null)
    {
        return argument ?? throw new ArgumentNullException(paramName);
    }
}

public static class KeycloakExtensions
{
    private const string AdminEnvVarName = "KC_BOOTSTRAP_ADMIN_USERNAME";
    private const string AdminPasswordEnvVarName = "KC_BOOTSTRAP_ADMIN_PASSWORD";

    private const string
        HealthCheckEnvVarName = "KC_HEALTH_ENABLED"; // As per https://www.keycloak.org/observability/health

    private const int DefaultContainerPort = 8443;

    private const int
        ManagementInterfaceContainerPort = 9000; // As per https://www.keycloak.org/server/management-interface

    private const string ManagementEndpointName = "management";
    private const string RealmImportDirectory = "/opt/keycloak/data/import";

    public static IResourceBuilder<KeycloakResource> AddHttpsKeycloak(
        this IDistributedApplicationBuilder builder,
        string name,
        int? port = null,
        int? managementPort = null,
        IResourceBuilder<ParameterResource>? adminUsername = null,
        IResourceBuilder<ParameterResource>? adminPassword = null)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(name);

        var passwordParameter = adminPassword?.Resource ??
                                ParameterResourceBuilderExtensions.CreateDefaultPasswordParameter(builder,
                                    $"{name}-password");

        var resource = new KeycloakResource(name, adminUsername?.Resource, passwordParameter);

        var keycloak = builder
            .AddResource(resource)
            .WithImage(KeycloakContainerImageTags.Image)
            .WithImageRegistry(KeycloakContainerImageTags.Registry)
            .WithImageTag(KeycloakContainerImageTags.Tag)
            // Mount the ASP.NET Core HTTPS devlopment certificate in the Keycloak container and configure Keycloak to it
            // via the KC_HTTPS_CERTIFICATE_FILE and KC_HTTPS_CERTIFICATE_KEY_FILE environment variables.
            .RunWithHttpsDevCertificate("KC_HTTPS_CERTIFICATE_FILE", "KC_HTTPS_CERTIFICATE_KEY_FILE")
            .WithHttpsEndpoint(env: "KC_HTTPS_PORT", port: port, targetPort: DefaultContainerPort)
            .WithHttpsEndpoint(managementPort, ManagementInterfaceContainerPort, ManagementEndpointName)
            .WithEnvironment("KC_HOSTNAME", "localhost")
            .WithEnvironment("KC_HTTP_ENABLED", "false")
            // Without disabling HTTP/2 you can hit HTTP 431 Header too large errors in Keycloak.
            // Related issues:
            // https://github.com/keycloak/keycloak/discussions/10236
            // https://github.com/keycloak/keycloak/issues/13933
            // https://github.com/quarkusio/quarkus/issues/33692
            .WithEnvironment("QUARKUS_HTTP_HTTP2", "false")
            .WithHttpsHealthCheck(endpointName: ManagementEndpointName, path: "/health/ready")
            .WithEnvironment(context =>
            {
                context.EnvironmentVariables[AdminEnvVarName] = resource.AdminReference;
                context.EnvironmentVariables[AdminPasswordEnvVarName] = resource.AdminPasswordParameter;
                context.EnvironmentVariables[HealthCheckEnvVarName] = "true";
            });

        if (builder.ExecutionContext.IsRunMode)
            keycloak.WithArgs("start-dev");
        else
            keycloak.WithArgs("start");

        keycloak.WithArgs("--import-realm");

        return keycloak;
    }

    /// <summary>
    ///     Adds a named volume for the data folder to a Keycloak container resource.
    /// </summary>
    /// <param name="builder">The resource builder.</param>
    /// <param name="name">
    ///     The name of the volume. Defaults to an auto-generated name based on the application and resource
    ///     names.
    /// </param>
    /// <returns>The <see cref="IResourceBuilder{T}" />.</returns>
    /// <remarks>
    ///     The volume is mounted at /opt/keycloak/data in the container.
    ///     <example>
    ///         Use a data volume
    ///         <code lang="csharp">
    /// var keycloak = builder.AddKeycloak("keycloak")
    ///                       .WithDataVolume();
    /// </code>
    ///     </example>
    /// </remarks>
    public static IResourceBuilder<KeycloakResource> WithDataVolume(this IResourceBuilder<KeycloakResource> builder,
        string? name = null)
    {
        ArgumentNullException.ThrowIfNull(builder);

        return builder.WithVolume(name ?? VolumeNameGenerator.Generate(builder, "data"), "/opt/keycloak/data");
    }

    /// <summary>
    ///     Adds a bind mount for the data folder to a Keycloak container resource.
    /// </summary>
    /// <param name="builder">The resource builder.</param>
    /// <param name="source">The source directory on the host to mount into the container.</param>
    /// <returns>The <see cref="IResourceBuilder{T}" />.</returns>
    /// <remarks>
    ///     The source directory is mounted at /opt/keycloak/data in the container.
    ///     <example>
    ///         Use a bind mount
    ///         <code lang="csharp">
    /// var keycloak = builder.AddKeycloak("keycloak")
    ///                       .WithDataBindMount("mydata");
    /// </code>
    ///     </example>
    /// </remarks>
    public static IResourceBuilder<KeycloakResource> WithDataBindMount(this IResourceBuilder<KeycloakResource> builder,
        string source)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentException.ThrowIfNullOrEmpty(source);

        return builder.WithBindMount(source, "/opt/keycloak/data");
    }

    /// <summary>
    ///     Adds a realm import to a Keycloak container resource.
    /// </summary>
    /// <param name="builder">The resource builder.</param>
    /// <param name="import">The directory containing the realm import files or a single import file.</param>
    /// <param name="isReadOnly">A flag that indicates if the realm import directory is read-only.</param>
    /// <returns>The <see cref="IResourceBuilder{T}" />.</returns>
    /// <remarks>
    ///     The realm import files are mounted at /opt/keycloak/data/import in the container.
    ///     <example>
    ///         Import the realms from a directory
    ///         <code lang="csharp">
    /// var keycloak = builder.AddKeycloak("keycloak")
    ///                       .WithRealmImport("../realms");
    /// </code>
    ///     </example>
    /// </remarks>
    public static IResourceBuilder<KeycloakResource> WithRealmImport(
        this IResourceBuilder<KeycloakResource> builder,
        string import,
        bool isReadOnly = false)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentException.ThrowIfNullOrEmpty(import);

        var importFullPath = Path.GetFullPath(import, builder.ApplicationBuilder.AppHostDirectory);

        if (Directory.Exists(importFullPath))
            return builder.WithBindMount(importFullPath, RealmImportDirectory, isReadOnly);

        if (File.Exists(importFullPath))
        {
            var fileName = Path.GetFileName(import);

            return builder.WithBindMount(importFullPath, $"{RealmImportDirectory}/{fileName}", isReadOnly);
        }

        throw new InvalidOperationException($"The realm import file or directory '{importFullPath}' does not exist.");
    }
}