#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["CloudFit.Rwo.Backend.Api/CloudFit.Rwo.Backend.Api.csproj", "CloudFit.Rwo.Backend.Api/"]
RUN dotnet restore "CloudFit.Rwo.Backend.Api/CloudFit.Rwo.Backend.Api.csproj"
COPY . .
WORKDIR "/src/CloudFit.Rwo.Backend.Api"
RUN dotnet build "CloudFit.Rwo.Backend.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CloudFit.Rwo.Backend.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CloudFit.Rwo.Backend.Api.dll"]