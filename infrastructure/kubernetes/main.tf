terraform {
  backend "azurerm" {
    resource_group_name  = "marxan-rg"     // var.resource_group_name
    storage_account_name = "marxansa"      // var.storage_account_name
    container_name       = "marxan-tnctfstate" // ${var.project_name}tfstate
    key                  = "kubernetes.tfstate"
  }
}

data "azurerm_resource_group" "resource_group" {
  name = var.resource_group_name
}

data "azurerm_subscription" "subscription" {}

data "azurerm_storage_account" "storage_account" {
  name                = var.storage_account_name
  resource_group_name = var.resource_group_name
}

data "terraform_remote_state" "core" {
  backend = "azurerm"
  config  = {
    resource_group_name  = var.resource_group_name
    storage_account_name = var.storage_account_name
    container_name       = "${var.project_name}tfstate"
    key                  = "infrastructure.tfstate"
  }
}

data "azurerm_kubernetes_cluster" "k8s_cluster" {
  name                = data.terraform_remote_state.core.outputs.k8s_cluster_name
  resource_group_name = data.azurerm_resource_group.resource_group.name
}

data "azurerm_dns_zone" "dns_zone" {
  name                = data.terraform_remote_state.core.outputs.dns_zone_name
  resource_group_name = data.azurerm_resource_group.resource_group.name
}

locals {
  temp_data_storage_class     = "azurefile-csi-temp-data"
  temp_data_pvc_name          = "shared-temp-data-storage"
  temp_data_volume_mount_path = "/tmp/storage"
  cloning_storage_class       = "azurefile-csi-cloning-data"
  cloning_pvc_name            = "shared-cloning-storage"
  cloning_volume_mount_path   = "/opt/marxan-project-cloning"
}

module "k8s_namespaces" {
  source     = "./modules/k8s_namespaces"
  namespaces = ["production", "staging"]
}

module "cert_manager" {
  source = "./modules/cert_manager"
  email  = var.cert_email
}

module "k8s_storage" {
  source                  = "./modules/storage"
  temp_data_storage_class = local.temp_data_storage_class
  cloning_storage_class   = local.cloning_storage_class
}

module "email_templates" {
  source        = "./modules/email-templates"
  domain        = var.email_domain
  support_email = var.support_email
}

#Production

module "key_vault_production" {
  count = var.deploy_production ? 1 : 0

  source                 = "./modules/key_vault"
  namespace              = "production"
  resource_group         = data.azurerm_resource_group.resource_group
  project_name           = var.project_name
  key_vault_access_users = var.key_vault_access_users
  project_tags           = merge(var.project_tags, { Environment = "PRD" })
}

module "k8s_api_database_production_tulip" {
  count = var.deploy_production ? 1 : 0

  source          = "./modules/database"
  resource_group  = data.azurerm_resource_group.resource_group
  project_name    = var.project_name
  namespace       = "production"
  name            = "api"
  sql_server_name = data.terraform_remote_state.core.outputs.sql_server_production_tulip_name

  providers = {
    postgresql = postgres.db_tunnel_production_tulip
  }
}

module "k8s_geoprocessing_database_production_tulip" {
  count = var.deploy_production ? 1 : 0

  source          = "./modules/database"
  resource_group  = data.azurerm_resource_group.resource_group
  project_name    = var.project_name
  namespace       = "production"
  name            = "geoprocessing"
  sql_server_name = data.terraform_remote_state.core.outputs.sql_server_production_tulip_name

  providers = {
    postgresql = postgres.db_tunnel_production_tulip
  }
}

module "storage_pvc_production" {
  count = var.deploy_production ? 1 : 0

  source                  = "./modules/volumes"
  namespace               = "production"
  temp_data_storage_class = local.temp_data_storage_class
  temp_data_pvc_name      = local.temp_data_pvc_name
  temp_data_storage_size  = var.temp_data_storage_size
  cloning_storage_class   = local.cloning_storage_class
  cloning_pvc_name        = local.cloning_pvc_name
  cloning_storage_size    = var.cloning_storage_size
}

module "api_production" {
  count = var.deploy_production ? 1 : 0

  source                             = "./modules/api"
  namespace                          = "production"
  image                              = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-api:production"
  deployment_name                    = "api"
  application_base_url               = "https://${var.domain}"
  network_cors_origins               = "https://${var.domain},http://localhost:3000"
  http_logging_morgan_format         = ""
  api_postgres_logging               = "error"
  temp_data_pvc_name                 = local.temp_data_pvc_name
  cloning_pvc_name                   = local.cloning_pvc_name
  postgres_geodb_max_clients_in_pool = 24
  sparkpost_base_url                 = var.sparkpost_base_url
  temp_data_volume_mount_path        = local.temp_data_volume_mount_path
  cloning_volume_mount_path          = local.cloning_volume_mount_path

  depends_on = [
    module.k8s_api_database_production_tulip
  ]
}

module "geoprocessing_production" {
  count = var.deploy_production ? 1 : 0

  source                      = "./modules/geoprocessing"
  namespace                   = "production"
  image                       = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-geoprocessing:production"
  deployment_name             = "geoprocessing"
  geo_postgres_logging        = "error"
  temp_data_pvc_name          = local.temp_data_pvc_name
  cloning_pvc_name            = local.cloning_pvc_name
  temp_data_volume_mount_path = local.temp_data_volume_mount_path
  cloning_volume_mount_path   = local.cloning_volume_mount_path

  depends_on = [
    module.k8s_geoprocessing_database_production_tulip
  ]
}

module "client_production" {
  count = var.deploy_production ? 1 : 0

  source          = "./modules/client"
  namespace       = "production"
  image           = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-client:production"
  deployment_name = "client"
  site_url        = "https://${data.terraform_remote_state.core.outputs.dns_zone_name}"
  api_url         = "https://api.${data.terraform_remote_state.core.outputs.dns_zone_name}"
}

module "webshot_production" {
  count = var.deploy_production ? 1 : 0

  source          = "./modules/webshot"
  namespace       = "production"
  image           = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-webshot:production"
  deployment_name = "webshot"
}

module "production_cloud_secrets" {
  count = var.deploy_production ? 1 : 0

  source                          = "./modules/cloud_secrets"
  project_name                    = var.project_name
  namespace                       = "production"
  name                            = "api"
  key_vault_id                    = length(module.key_vault_production) > 0 ? module.key_vault_production[0].key_vault_id : null
  redis_host                      = data.terraform_remote_state.core.outputs.redis_hostname
  redis_password                  = data.terraform_remote_state.core.outputs.redis_password
  redis_port                      = data.terraform_remote_state.core.outputs.redis_port
  sparkpost_api_key               = var.sparkpost_api_key
  api_url                         = "api.${var.domain}"
  postgres_api_database           = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_database : null
  postgres_api_username           = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_username : null
  postgres_api_password           = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_password : null
  postgres_api_hostname           = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_hostname : null
  postgres_geoprocessing_database = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_database : null
  postgres_geoprocessing_username = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_username : null
  postgres_geoprocessing_password = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_password : null
  postgres_geoprocessing_hostname = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_hostname : null
  azure_storage_account_key       = data.azurerm_storage_account.storage_account.primary_access_key
}

module "production_kubernetes_secrets" {
  count = var.deploy_production ? 1 : 0

  source                                 = "./modules/kubernetes_secrets"
  project_name                           = var.project_name
  namespace                              = "production"
  name                                   = "api"
  key_vault_id                           = length(module.key_vault_production) > 0 ? module.key_vault_production[0].key_vault_id : null
  redis_host                             = data.terraform_remote_state.core.outputs.redis_hostname
  redis_password                         = data.terraform_remote_state.core.outputs.redis_password
  redis_port                             = data.terraform_remote_state.core.outputs.redis_port
  sparkpost_api_key                      = var.sparkpost_api_key
  api_url                                = "api.${var.domain}"
  postgres_api_database                  = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_database : null
  postgres_api_username                  = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_username : null
  postgres_api_password                  = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_password : null
  postgres_api_hostname                  = length(module.k8s_api_database_production_tulip) > 0 ? module.k8s_api_database_production_tulip[0].postgresql_hostname : null
  postgres_geoprocessing_database        = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_database : null
  postgres_geoprocessing_username        = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_username : null
  postgres_geoprocessing_password        = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_password : null
  postgres_geoprocessing_hostname        = length(module.k8s_geoprocessing_database_production_tulip) > 0 ? module.k8s_geoprocessing_database_production_tulip[0].postgresql_hostname : null
  azure_storage_account_key              = data.azurerm_storage_account.storage_account.primary_access_key
  api_auth_jwt_secret                    = length(module.production_cloud_secrets) > 0 ? module.production_cloud_secrets[0].api_auth_jwt_secret : null
  x_auth_api_key                         = length(module.production_cloud_secrets) > 0 ? module.production_cloud_secrets[0].x_auth_api_key : null
  cloning_signing_secret                 = length(module.production_cloud_secrets) > 0 ? module.production_cloud_secrets[0].cloning_signing_secret : null
  cloning_storage_backup_restic_password = length(module.production_cloud_secrets) > 0 ? module.production_cloud_secrets[0].cloning_storage_backup_restic_password : null
}

module "ingress_production" {
  count = var.deploy_production ? 1 : 0

  source         = "./modules/ingress"
  namespace      = "production"
  resource_group = data.azurerm_resource_group.resource_group
  project_name   = var.project_name
  dns_zone       = data.azurerm_dns_zone.dns_zone
  domain         = var.domain
  project_tags   = var.project_tags
}

data "azurerm_postgresql_flexible_server" "marxan_production_tulip" {
  count               = var.deploy_production ? 1 : 0
  name                = lookup(data.terraform_remote_state.core.outputs, "sql_server_production_tulip_name", null)
  resource_group_name = data.azurerm_resource_group.resource_group.name
}

module "db_tunnel_production_tulip" {
  count = var.deploy_production ? 1 : 0

  source = "git::https://github.com/tiagojsag/terraform-ssh-tunnel.git?ref=feature/disable-strict-host-key-checking"

  target_host = lookup(data.azurerm_postgresql_flexible_server.marxan_production_tulip[0], "fqdn", null)
  target_port = 5432

  gateway_host = data.terraform_remote_state.core.outputs.bastion_hostname
  gateway_user = "ubuntu"
}

module "cloning_storage_backup_cronjob_production" {
  count = var.deploy_production ? 1 : 0

  source                       = "./modules/backup"
  namespace                    = "production"
  cloning_pvc_name             = local.cloning_pvc_name
  cloning_volume_mount_path    = local.cloning_volume_mount_path
  azure_storage_account_name   = var.storage_account_name
  restic_repository            = "azure:${data.terraform_remote_state.core.outputs.cloning_storage_backup_container_production}:/restic-backups/cloning-storage-production"
  restic_forget_cli_parameters = "--keep-daily 60 --keep-weekly 52"
  schedule                     = "15 23 * * *"
}


#Staging

module "key_vault_staging" {
  source                 = "./modules/key_vault"
  namespace              = "staging"
  resource_group         = data.azurerm_resource_group.resource_group
  project_name           = var.project_name
  key_vault_access_users = var.key_vault_access_users
  project_tags           = merge(var.project_tags, { Environment = "STG" })
}

module "k8s_api_database_staging_14" {
  source          = "./modules/database"
  resource_group  = data.azurerm_resource_group.resource_group
  project_name    = var.project_name
  namespace       = "staging"
  name            = "api"
  sql_server_name = data.terraform_remote_state.core.outputs.sql_server_staging_14_name

  providers = {
    postgresql = postgres.db_tunnel_staging_14
  }
}

module "k8s_geoprocessing_database_staging_14" {
  source          = "./modules/database"
  resource_group  = data.azurerm_resource_group.resource_group
  project_name    = var.project_name
  namespace       = "staging"
  name            = "geoprocessing"
  sql_server_name = data.terraform_remote_state.core.outputs.sql_server_staging_14_name

  providers = {
    postgresql = postgres.db_tunnel_staging_14
  }
}

module "storage_pvc_staging" {
  source                  = "./modules/volumes"
  namespace               = "staging"
  temp_data_storage_class = local.temp_data_storage_class
  temp_data_pvc_name      = local.temp_data_pvc_name
  temp_data_storage_size  = var.temp_data_storage_size
  cloning_storage_class   = local.cloning_storage_class
  cloning_pvc_name        = local.cloning_pvc_name
  cloning_storage_size    = var.cloning_storage_size
}

module "api_staging" {
  source                             = "./modules/api"
  namespace                          = "staging"
  image                              = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-api:staging"
  deployment_name                    = "api"
  application_base_url               = "https://staging.${var.domain}"
  network_cors_origins               = "https://staging.${var.domain},http://localhost:3000"
  http_logging_morgan_format         = "short"
  api_postgres_logging               = "query"
  temp_data_pvc_name                 = local.temp_data_pvc_name
  cloning_pvc_name                   = local.cloning_pvc_name
  postgres_geodb_max_clients_in_pool = 10
  sparkpost_base_url                 = var.sparkpost_base_url
  temp_data_volume_mount_path        = local.temp_data_volume_mount_path
  cloning_volume_mount_path          = local.cloning_volume_mount_path

  depends_on = [
    module.k8s_api_database_staging_14
  ]
}

module "geoprocessing_staging" {
  source                      = "./modules/geoprocessing"
  namespace                   = "staging"
  image                       = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-geoprocessing:staging"
  deployment_name             = "geoprocessing"
  cleanup_temporary_folders   = "false"
  geo_postgres_logging        = "query"
  temp_data_pvc_name          = local.temp_data_pvc_name
  cloning_pvc_name            = local.cloning_pvc_name
  temp_data_volume_mount_path = local.temp_data_volume_mount_path
  cloning_volume_mount_path   = local.cloning_volume_mount_path

  depends_on = [
    module.k8s_geoprocessing_database_staging_14
  ]
}

module "client_staging" {
  source          = "./modules/client"
  namespace       = "staging"
  image           = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-client:staging"
  deployment_name = "client"
  site_url        = "https://staging.${data.terraform_remote_state.core.outputs.dns_zone_name}"
  api_url         = "https://api.staging.${data.terraform_remote_state.core.outputs.dns_zone_name}"
}

module "webshot_staging" {
  source          = "./modules/webshot"
  namespace       = "staging"
  image           = "${data.terraform_remote_state.core.outputs.container_registry_hostname}/marxan-webshot:staging"
  deployment_name = "webshot"
}

module "staging_cloud_secrets" {
  source                          = "./modules/cloud_secrets"
  project_name                    = var.project_name
  namespace                       = "staging"
  name                            = "api"
  key_vault_id                    = module.key_vault_staging.key_vault_id
  redis_host                      = data.terraform_remote_state.core.outputs.redis_hostname
  redis_password                  = data.terraform_remote_state.core.outputs.redis_password
  redis_port                      = data.terraform_remote_state.core.outputs.redis_port
  sparkpost_api_key               = var.sparkpost_api_key
  api_url                         = "api.staging.${var.domain}"
  postgres_api_database           = module.k8s_api_database_staging_14.postgresql_database
  postgres_api_username           = module.k8s_api_database_staging_14.postgresql_username
  postgres_api_password           = module.k8s_api_database_staging_14.postgresql_password
  postgres_api_hostname           = module.k8s_api_database_staging_14.postgresql_hostname
  postgres_geoprocessing_database = module.k8s_geoprocessing_database_staging_14.postgresql_database
  postgres_geoprocessing_username = module.k8s_geoprocessing_database_staging_14.postgresql_username
  postgres_geoprocessing_password = module.k8s_geoprocessing_database_staging_14.postgresql_password
  postgres_geoprocessing_hostname = module.k8s_geoprocessing_database_staging_14.postgresql_hostname
  azure_storage_account_key       = data.azurerm_storage_account.storage_account.primary_access_key
}

module "staging_kubernetes_secrets" {
  source                                 = "./modules/kubernetes_secrets"
  project_name                           = var.project_name
  namespace                              = "staging"
  name                                   = "api"
  key_vault_id                           = module.key_vault_staging.key_vault_id
  redis_host                             = data.terraform_remote_state.core.outputs.redis_hostname
  redis_password                         = data.terraform_remote_state.core.outputs.redis_password
  redis_port                             = data.terraform_remote_state.core.outputs.redis_port
  sparkpost_api_key                      = var.sparkpost_api_key
  api_url                                = "api.staging.${var.domain}"
  postgres_api_database                  = module.k8s_api_database_staging_14.postgresql_database
  postgres_api_username                  = module.k8s_api_database_staging_14.postgresql_username
  postgres_api_password                  = module.k8s_api_database_staging_14.postgresql_password
  postgres_api_hostname                  = module.k8s_api_database_staging_14.postgresql_hostname
  postgres_geoprocessing_database        = module.k8s_geoprocessing_database_staging_14.postgresql_database
  postgres_geoprocessing_username        = module.k8s_geoprocessing_database_staging_14.postgresql_username
  postgres_geoprocessing_password        = module.k8s_geoprocessing_database_staging_14.postgresql_password
  postgres_geoprocessing_hostname        = module.k8s_geoprocessing_database_staging_14.postgresql_hostname
  azure_storage_account_key              = data.azurerm_storage_account.storage_account.primary_access_key
  api_auth_jwt_secret                    = module.staging_cloud_secrets.api_auth_jwt_secret
  x_auth_api_key                         = module.staging_cloud_secrets.x_auth_api_key
  cloning_signing_secret                 = module.staging_cloud_secrets.cloning_signing_secret
  cloning_storage_backup_restic_password = module.staging_cloud_secrets.cloning_storage_backup_restic_password
}

module "ingress_staging" {
  source         = "./modules/ingress"
  namespace      = "staging"
  resource_group = data.azurerm_resource_group.resource_group
  project_name   = var.project_name
  dns_zone       = data.azurerm_dns_zone.dns_zone
  domain         = var.domain
  domain_prefix  = "staging"
  project_tags   = var.project_tags
}

data "azurerm_postgresql_flexible_server" "marxan_staging_14" {
  name                = data.terraform_remote_state.core.outputs.sql_server_staging_14_name
  resource_group_name = data.azurerm_resource_group.resource_group.name
}

module "db_tunnel_staging_14" {
  source = "git::https://github.com/tiagojsag/terraform-ssh-tunnel.git?ref=feature/disable-strict-host-key-checking"

  target_host = data.azurerm_postgresql_flexible_server.marxan_staging_14.fqdn
  target_port = 5432

  gateway_host = data.terraform_remote_state.core.outputs.bastion_hostname
  gateway_user = "ubuntu"
}

module "cloning_storage_backup_cronjob_staging" {
  source                       = "./modules/backup"
  namespace                    = "staging"
  cloning_pvc_name             = local.cloning_pvc_name
  cloning_volume_mount_path    = local.cloning_volume_mount_path
  azure_storage_account_name   = var.storage_account_name
  restic_repository            = "azure:${data.terraform_remote_state.core.outputs.cloning_storage_backup_container_staging}:/restic-backups/cloning-storage-staging"
  restic_forget_cli_parameters = "--keep-daily 30 --keep-weekly 8"
  schedule                     = "15 6 * * *"
}

module "staging_ping_test" {
  count = var.deploy_staging ? 1 : 0

  source                = "./modules/ping_test"
  namespace             = "staging"
  resource_group        = data.azurerm_resource_group.resource_group
  project_name          = var.project_name
  location              = data.azurerm_resource_group.resource_group.location
  domain                = "staging.${var.domain}"
  alert_email_addresses = var.alert_email_addresses
}

module "production_ping_test" {
  count = var.deploy_production ? 1 : 0

  source                = "./modules/ping_test"
  namespace             = "production"
  resource_group        = data.azurerm_resource_group.resource_group
  project_name          = var.project_name
  location              = data.azurerm_resource_group.resource_group.location
  domain                = var.domain
  alert_email_addresses = var.alert_email_addresses
}
