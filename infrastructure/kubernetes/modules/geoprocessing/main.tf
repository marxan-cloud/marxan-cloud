resource "kubernetes_service" "geoprocessing_service" {
  metadata {
    name      = kubernetes_deployment.geoprocessing_deployment.metadata[0].name
    namespace = var.namespace
  }
  spec {
    selector = {
      name = kubernetes_deployment.geoprocessing_deployment.metadata[0].name
    }
    port {
      port        = 30002
      target_port = 3000
    }

    type = "NodePort"
  }
}

resource "kubernetes_deployment" "geoprocessing_deployment" {
  metadata {
    name      = var.deployment_name
    namespace = var.namespace
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        name = var.deployment_name
      }
    }

    template {
      metadata {
        labels = {
          name = var.deployment_name
        }
      }

      spec {
        affinity {
          node_affinity {
            required_during_scheduling_ignored_during_execution {
              node_selector_term {
                match_expressions {
                  key      = "type"
                  values   = ["app"]
                  operator = "In"
                }
              }
            }
          }
        }

        volume {
          name = "shared-temp-data-storage"
          persistent_volume_claim {
            claim_name = var.temp_data_pvc_name
          }
        }

        volume {
          name = "shared-cloning-storage"
          persistent_volume_claim {
            claim_name = var.cloning_pvc_name
          }
        }

        container {
          image             = var.image
          image_pull_policy = "Always"
          name              = var.deployment_name

          args = ["start"]

          volume_mount {
            mount_path  = var.temp_data_volume_mount_path
            name        = "shared-temp-data-storage"
          }

          volume_mount {
            mount_path  = var.cloning_volume_mount_path
            name        = "shared-cloning-storage"
          }

          env {
            name = "API_POSTGRES_HOST"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "API_POSTGRES_HOST"
              }
            }
          }

          env {
            name = "API_POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "API_POSTGRES_USER"
              }
            }
          }

          env {
            name = "API_POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "API_POSTGRES_PASSWORD"
              }
            }
          }

          env {
            name = "API_POSTGRES_DB"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "API_POSTGRES_DB"
              }
            }
          }

          env {
            name = "API_POSTGRES_SSL_MODE"
            value = true
          }

          env {
            name = "GEO_POSTGRES_SSL_MODE"
            value = true
          }

          env {
            name = "GEO_POSTGRES_HOST"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "GEO_POSTGRES_HOST"
              }
            }
          }

          env {
            name = "GEO_POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "GEO_POSTGRES_USER"
              }
            }
          }

          env {
            name = "GEO_POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "GEO_POSTGRES_PASSWORD"
              }
            }
          }

          env {
            name = "GEO_POSTGRES_DB"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "GEO_POSTGRES_DB"
              }
            }
          }

          env {
            name = "API_AUTH_JWT_SECRET"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "API_AUTH_JWT_SECRET"
              }
            }
          }

          env {
            name = "API_AUTH_X_API_KEY"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "API_AUTH_X_API_KEY"
              }
            }
          }

          env {
            name = "REDIS_HOST"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "REDIS_HOST"
              }
            }
          }

          env {
            name = "REDIS_PASSWORD"
            value_from {
              secret_key_ref {
                name = "geoprocessing"
                key  = "REDIS_PASSWORD"
              }
            }
          }

          env {
            name = "REDIS_PORT"
            value_from {
              secret_key_ref {
                name = "api"
                key  = "REDIS_PORT"
              }
            }
          }

          env {
            name  = "REDIS_USE_TLS"
            value = "true"
          }

          env {
            name  = "API_SERVICE_PORT"
            value = 3000
          }

          env {
            name  = "GEOPROCESSING_RUN_MIGRATIONS_ON_STARTUP"
            value = true
          }

          env {
            name  = "NODE_CONFIG_DIR"
            value = "apps/geoprocessing/config"
          }

          env {
            name  = "NODE_ENV"
            value = var.namespace
          }

          env {
            name  = "BACKEND_CLEANUP_TEMPORARY_FOLDERS"
            value = var.cleanup_temporary_folders
          }

          env {
            name  = "GEO_POSTGRES_LOGGING"
            value = var.geo_postgres_logging
          }

          resources {
            limits = {
              cpu    = "1"
              memory = "4Gi"
            }
            requests = {
              cpu    = "500m"
              memory = "3Gi"
            }
          }

          liveness_probe {
            http_get {
              path   = "/api/ping"
              port   = 3000
              scheme = "HTTP"
            }

            success_threshold     = 1
            timeout_seconds       = 5
            initial_delay_seconds = 90
            period_seconds        = 30
          }

          readiness_probe {
            http_get {
              path   = "/api/ping"
              port   = 3000
              scheme = "HTTP"
            }

            success_threshold     = 1
            timeout_seconds       = 5
            initial_delay_seconds = 30
            period_seconds        = 15
          }
        }
      }
    }
  }
}


