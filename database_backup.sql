/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.15-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: sat_acme
-- ------------------------------------------------------
-- Server version	10.11.15-MariaDB-ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `access_audit_log`
--

DROP TABLE IF EXISTS `access_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_audit_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action` varchar(200) NOT NULL COMMENT 'Acción realizada o intentada',
  `resource_type` varchar(100) DEFAULT NULL COMMENT 'Tipo de recurso (ej: client, service)',
  `resource_id` int(11) DEFAULT NULL COMMENT 'ID del recurso específico',
  `result` enum('success','denied','error') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_path` varchar(500) DEFAULT NULL,
  `request_method` varchar(10) DEFAULT NULL COMMENT 'GET, POST, PUT, DELETE',
  `error_message` text DEFAULT NULL COMMENT 'Mensaje de error si result=error',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_action` (`user_id`,`action`),
  KEY `idx_timestamp` (`created_at`),
  KEY `idx_result` (`result`),
  KEY `idx_resource` (`resource_type`,`resource_id`),
  CONSTRAINT `access_audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_audit_log`
--

LOCK TABLES `access_audit_log` WRITE;
/*!40000 ALTER TABLE `access_audit_log` DISABLE KEYS */;
INSERT INTO `access_audit_log` VALUES
(1,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-26 18:31:18'),
(2,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-26 18:31:19'),
(3,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-26 18:31:19'),
(4,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-26 18:31:20'),
(5,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-26 22:42:55'),
(6,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-26 22:42:56'),
(7,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-26 22:42:58'),
(8,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-26 22:43:00'),
(9,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 03:25:29'),
(10,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 03:25:30'),
(11,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 03:25:31'),
(12,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 03:25:32'),
(13,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 03:49:35'),
(14,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 03:49:36'),
(15,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 03:49:37'),
(16,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 03:49:38'),
(17,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 04:32:59'),
(18,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 04:33:00'),
(19,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 04:44:04'),
(20,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 04:51:13'),
(21,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 04:51:14'),
(22,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 04:51:14'),
(23,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 04:51:16'),
(24,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 04:53:05'),
(25,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 04:53:06'),
(26,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 05:13:23'),
(27,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 05:13:24'),
(28,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:13:25'),
(29,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:13:26'),
(30,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:22:17'),
(31,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:22:18'),
(32,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:23:31'),
(33,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:23:32'),
(34,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:56:20'),
(35,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 05:56:27'),
(36,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 17:41:39'),
(37,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 17:41:40'),
(38,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 17:41:41'),
(39,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 17:41:42'),
(40,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 17:41:43'),
(41,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 19:35:43'),
(42,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=true','GET',NULL,'2025-12-27 19:35:44'),
(43,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 19:35:45'),
(44,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-27 19:35:46'),
(45,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-28 03:09:49'),
(46,1,'roles:list',NULL,NULL,'denied','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','/api/roles-permissions/roles?include_stats=false','GET',NULL,'2025-12-28 03:09:54');
/*!40000 ALTER TABLE `access_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bundle_services`
--

DROP TABLE IF EXISTS `bundle_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bundle_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bundle_id` int(11) NOT NULL COMMENT 'ID del paquete',
  `service_id` int(11) NOT NULL COMMENT 'ID del servicio incluido en el paquete',
  `include_in_base_price` tinyint(1) DEFAULT 1 COMMENT 'Si TRUE, el precio del servicio está incluido en el precio base del bundle',
  `add_when_due` tinyint(1) DEFAULT 0 COMMENT 'Si TRUE, se suma el precio del servicio cuando corresponde por recurrencia',
  `custom_price` decimal(10,2) DEFAULT NULL COMMENT 'Precio personalizado del servicio dentro del bundle (NULL = usar default_price)',
  `assignment_type` enum('all_clients','selected_clients') DEFAULT 'all_clients' COMMENT 'Si el servicio del bundle se asigna a todos o solo seleccionados',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bundle_service` (`bundle_id`,`service_id`),
  KEY `idx_bundle` (`bundle_id`),
  KEY `idx_service` (`service_id`),
  KEY `idx_bundle_services_assignment` (`assignment_type`),
  CONSTRAINT `bundle_services_ibfk_1` FOREIGN KEY (`bundle_id`) REFERENCES `service_bundles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bundle_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Servicios incluidos en cada paquete';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bundle_services`
--

LOCK TABLES `bundle_services` WRITE;
/*!40000 ALTER TABLE `bundle_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `bundle_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_bundles`
--

DROP TABLE IF EXISTS `client_bundles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_bundles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL COMMENT 'ID del cliente',
  `bundle_id` int(11) NOT NULL COMMENT 'ID del paquete contratado',
  `custom_price` decimal(10,2) DEFAULT NULL COMMENT 'Precio personalizado para este cliente (si aplica)',
  `start_date` date DEFAULT NULL COMMENT 'Fecha de inicio del paquete',
  `status` varchar(50) DEFAULT 'active' COMMENT 'Estado del paquete para este cliente',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`client_user_id`),
  KEY `idx_bundle` (`bundle_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `client_bundles_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_bundles_ibfk_2` FOREIGN KEY (`bundle_id`) REFERENCES `service_bundles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Paquetes contratados por cada cliente';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_bundles`
--

LOCK TABLES `client_bundles` WRITE;
/*!40000 ALTER TABLE `client_bundles` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_bundles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_custom_values`
--

DROP TABLE IF EXISTS `client_custom_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_custom_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `field_id` int(11) NOT NULL,
  `field_value` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_client_field` (`client_user_id`,`field_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `client_custom_values_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_custom_values_ibfk_2` FOREIGN KEY (`field_id`) REFERENCES `client_profile_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_custom_values`
--

LOCK TABLES `client_custom_values` WRITE;
/*!40000 ALTER TABLE `client_custom_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_custom_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_infractions`
--

DROP TABLE IF EXISTS `client_infractions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_infractions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `client_user_id` int(11) NOT NULL,
  `infraction_type` enum('automatic_unpaid','manual') NOT NULL COMMENT 'automatic_unpaid=generada automáticamente por no pago, manual=creada por admin',
  `reason` text NOT NULL COMMENT 'Motivo de la infracción',
  `related_invoice_id` int(11) DEFAULT NULL COMMENT 'ID de la factura relacionada (para infracciones por no pago)',
  `created_by_user_id` int(11) DEFAULT NULL COMMENT 'ID del admin que creó la infracción (NULL para automáticas)',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Si la infracción está activa (puede ser cancelada por admin)',
  `resolved_by_user_id` int(11) DEFAULT NULL COMMENT 'ID del admin que resolvió/canceló la infracción',
  `resolved_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha en que se resolvió la infracción',
  `resolution_notes` text DEFAULT NULL COMMENT 'Notas sobre cómo se resolvió',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `related_invoice_id` (`related_invoice_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `resolved_by_user_id` (`resolved_by_user_id`),
  KEY `idx_client_active` (`client_user_id`,`is_active`),
  KEY `idx_type` (`infraction_type`),
  KEY `idx_infractions_workspace` (`workspace_id`),
  CONSTRAINT `client_infractions_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_infractions_ibfk_2` FOREIGN KEY (`related_invoice_id`) REFERENCES `monthly_invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `client_infractions_ibfk_3` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `client_infractions_ibfk_4` FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Registro de infracciones de clientes (automáticas o manuales)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_infractions`
--

LOCK TABLES `client_infractions` WRITE;
/*!40000 ALTER TABLE `client_infractions` DISABLE KEYS */;
INSERT INTO `client_infractions` VALUES
(1,NULL,317,'manual','gay',NULL,1,0,1,'2025-12-27 19:32:49','gay','2025-12-27 17:36:26'),
(2,3,317,'manual','por gay',NULL,1,0,1,'2025-12-28 17:55:20','Resuelta por administrador','2025-12-28 04:14:09'),
(3,3,317,'manual','por ser mas gay',NULL,1,0,1,'2025-12-28 17:55:18','Resuelta por administrador','2025-12-28 04:14:23'),
(4,3,317,'manual','por super gay',NULL,1,0,1,'2025-12-28 17:55:13','Resuelta por administrador','2025-12-28 04:14:37'),
(5,3,317,'manual','clientes extremadamente gay\n',NULL,1,0,1,'2025-12-28 17:55:10','Resuelta por administrador','2025-12-28 04:14:52'),
(6,3,317,'manual','ultragay',NULL,1,0,1,'2025-12-28 17:55:07','Resuelta por administrador','2025-12-28 04:33:35'),
(8,3,3,'manual','Test infraccion 1',NULL,1,1,NULL,NULL,NULL,'2025-12-28 05:23:23'),
(9,3,3,'manual','Test infraccion 2',NULL,1,1,NULL,NULL,NULL,'2025-12-28 05:23:23');
/*!40000 ALTER TABLE `client_infractions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_insert_infraction
AFTER INSERT ON client_infractions
FOR EACH ROW
BEGIN
  IF NEW.is_active = TRUE THEN
    
    UPDATE clients_profiles
    SET active_infractions_count = active_infractions_count + 1
    WHERE user_id = NEW.client_user_id;

    
    UPDATE users
    SET services_disabled_by_infractions = TRUE
    WHERE id = NEW.client_user_id
      AND (SELECT active_infractions_count FROM clients_profiles WHERE user_id = NEW.client_user_id) >= 3;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_update_infraction
AFTER UPDATE ON client_infractions
FOR EACH ROW
BEGIN
  
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    UPDATE clients_profiles
    SET active_infractions_count = GREATEST(0, active_infractions_count - 1)
    WHERE user_id = NEW.client_user_id;
  END IF;

  
  IF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
    UPDATE clients_profiles
    SET active_infractions_count = active_infractions_count + 1
    WHERE user_id = NEW.client_user_id;
  END IF;

  
  UPDATE users u
  JOIN clients_profiles cp ON u.id = cp.user_id
  SET u.services_disabled_by_infractions = (cp.active_infractions_count >= 3)
  WHERE u.id = NEW.client_user_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_delete_infraction
AFTER DELETE ON client_infractions
FOR EACH ROW
BEGIN
  IF OLD.is_active = TRUE THEN
    UPDATE clients_profiles
    SET active_infractions_count = GREATEST(0, active_infractions_count - 1)
    WHERE user_id = OLD.client_user_id;

    
    UPDATE users u
    JOIN clients_profiles cp ON u.id = cp.user_id
    SET u.services_disabled_by_infractions = (cp.active_infractions_count >= 3)
    WHERE u.id = OLD.client_user_id;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `client_omisos`
--

DROP TABLE IF EXISTS `client_omisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_omisos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `motivo` text NOT NULL,
  `archivo_path` varchar(255) NOT NULL,
  `estado` enum('activo','resuelto') DEFAULT 'activo',
  `task_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by_user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `resolved_by_user_id` (`resolved_by_user_id`),
  KEY `idx_client_estado` (`client_id`,`estado`),
  KEY `idx_task` (`task_id`),
  KEY `idx_omisos_workspace` (`workspace_id`),
  CONSTRAINT `client_omisos_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_omisos_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `monthly_service_checklist` (`id`) ON DELETE SET NULL,
  CONSTRAINT `client_omisos_ibfk_3` FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_omisos`
--

LOCK TABLES `client_omisos` WRITE;
/*!40000 ALTER TABLE `client_omisos` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_omisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_payments`
--

DROP TABLE IF EXISTS `client_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `workspace_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','transfer','card','other') DEFAULT 'cash',
  `payment_type` enum('regular','advance','partial','debt') DEFAULT 'regular',
  `notes` text DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `registered_by_user_id` int(11) NOT NULL,
  `balance_before` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `registered_by_user_id` (`registered_by_user_id`),
  KEY `idx_client` (`client_user_id`),
  KEY `idx_workspace` (`workspace_id`),
  KEY `idx_date` (`payment_date`),
  CONSTRAINT `client_payments_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_payments_ibfk_2` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_payments_ibfk_3` FOREIGN KEY (`registered_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_payments`
--

LOCK TABLES `client_payments` WRITE;
/*!40000 ALTER TABLE `client_payments` DISABLE KEYS */;
INSERT INTO `client_payments` VALUES
(3,3,1,100.00,'cash','regular','Pago mensual + anticipo',NULL,1,0.00,100.00,'2025-01-15','2025-12-28 07:01:44'),
(4,4,1,100.00,'cash','regular','Pago mensual + anticipo',NULL,1,0.00,100.00,'2025-01-15','2025-12-28 07:01:44'),
(5,5,1,100.00,'cash','regular','Pago mensual + anticipo',NULL,1,0.00,100.00,'2025-01-15','2025-12-28 07:01:44'),
(6,6,1,100.00,'cash','regular','Pago mensual + anticipo',NULL,1,0.00,100.00,'2025-01-15','2025-12-28 07:01:45'),
(7,3,1,75.00,'cash','regular','Test fix bug 1',NULL,1,50.00,125.00,'2025-02-15','2025-12-28 07:09:10');
/*!40000 ALTER TABLE `client_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_pool`
--

DROP TABLE IF EXISTS `client_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_pool` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `client_user_id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `description` text NOT NULL COMMENT 'Descripción de la tarea pendiente',
  `priority` enum('baja','normal','alta','urgente') DEFAULT 'normal',
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `added_by_user_id` int(11) DEFAULT NULL,
  `assigned_to_user_id` int(11) DEFAULT NULL COMMENT 'Usuario que tomó la tarea del pool',
  `completed_by_user_id` int(11) DEFAULT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `task_id` (`task_id`),
  KEY `service_id` (`service_id`),
  KEY `added_by_user_id` (`added_by_user_id`),
  KEY `completed_by_user_id` (`completed_by_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_client` (`client_user_id`),
  KEY `idx_assigned_to` (`assigned_to_user_id`),
  KEY `idx_pool_workspace` (`workspace_id`),
  CONSTRAINT `client_pool_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_pool_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `monthly_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_pool_ibfk_3` FOREIGN KEY (`task_id`) REFERENCES `monthly_service_checklist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_pool_ibfk_4` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `client_pool_ibfk_5` FOREIGN KEY (`added_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `client_pool_ibfk_6` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `client_pool_ibfk_7` FOREIGN KEY (`completed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Pool compartido de tareas de clientes para colaboración entre empleados';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_pool`
--

LOCK TABLES `client_pool` WRITE;
/*!40000 ALTER TABLE `client_pool` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_profile_columns`
--

DROP TABLE IF EXISTS `client_profile_columns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_profile_columns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `column_name` varchar(50) NOT NULL,
  `column_type` varchar(100) NOT NULL DEFAULT 'VARCHAR(255)',
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by_user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `column_name` (`column_name`),
  KEY `created_by_user_id` (`created_by_user_id`),
  CONSTRAINT `client_profile_columns_ibfk_1` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_profile_columns`
--

LOCK TABLES `client_profile_columns` WRITE;
/*!40000 ALTER TABLE `client_profile_columns` DISABLE KEYS */;
INSERT INTO `client_profile_columns` VALUES
(1,'user_id','INT',1,'2025-12-26 18:04:24',NULL),
(2,'workspace_id','INT',1,'2025-12-26 18:04:24',NULL),
(3,'contract_number','VARCHAR(50)',1,'2025-12-26 18:04:24',NULL),
(4,'sat_password_encrypted','VARCHAR(255)',1,'2025-12-26 18:04:24',NULL),
(5,'overall_rating','DECIMAL(3,2)',1,'2025-12-26 18:04:24',NULL),
(6,'notes','TEXT',1,'2025-12-26 18:04:24',NULL),
(7,'sede','VARCHAR(100)',1,'2025-12-26 18:04:24',NULL),
(8,'grupo','VARCHAR(50)',1,'2025-12-26 18:04:24',NULL),
(9,'active_infractions_count','INT',1,'2025-12-26 18:04:24',NULL),
(10,'ratings_count','INT',1,'2025-12-26 18:04:24',NULL),
(14,'campo_provial','VARCHAR(255)',0,'2025-12-28 03:10:24',1),
(15,'campo_test_provial','VARCHAR(255)',0,'2025-12-28 03:27:25',1),
(16,'campo_general','VARCHAR(255)',0,'2025-12-28 03:36:33',1);
/*!40000 ALTER TABLE `client_profile_columns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_profile_fields`
--

DROP TABLE IF EXISTS `client_profile_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_profile_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `field_key` varchar(50) NOT NULL COMMENT 'Nombre interno del campo (slug)',
  `field_label` varchar(100) NOT NULL COMMENT 'Etiqueta visible',
  `field_type` enum('text','number','email','phone','date','select','textarea','checkbox') DEFAULT 'text',
  `placeholder` varchar(200) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `show_in_registration` tinyint(1) DEFAULT 1 COMMENT 'Mostrar en formulario de registro',
  `select_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Opciones para campos tipo select' CHECK (json_valid(`select_options`)),
  `validation_pattern` varchar(200) DEFAULT NULL COMMENT 'Regex para validación',
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_system_field` tinyint(1) DEFAULT 0,
  `source_table` enum('users','clients_profiles') DEFAULT 'clients_profiles',
  `column_type` varchar(50) DEFAULT 'VARCHAR(255)',
  `column_exists` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_field_key` (`workspace_id`,`field_key`),
  KEY `idx_workspace` (`workspace_id`),
  KEY `idx_order` (`display_order`),
  KEY `idx_cpf_workspace_key` (`workspace_id`,`field_key`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_profile_fields`
--

LOCK TABLES `client_profile_fields` WRITE;
/*!40000 ALTER TABLE `client_profile_fields` DISABLE KEYS */;
INSERT INTO `client_profile_fields` VALUES
(15,NULL,'sat_password','Contraseña SAT','text',NULL,1,1,1,NULL,NULL,4,'2025-12-27 22:30:58','2025-12-28 03:49:27',1,'clients_profiles','VARCHAR(255)',1),
(16,NULL,'firma_electronica','Firma Electrónica','text',NULL,0,1,0,NULL,NULL,5,'2025-12-27 22:30:58','2025-12-28 03:49:27',1,'clients_profiles','VARCHAR(255)',1),
(17,NULL,'phone_number','Teléfono','phone',NULL,0,1,1,NULL,NULL,6,'2025-12-27 22:30:58','2025-12-28 03:49:27',1,'clients_profiles','VARCHAR(50)',1),
(18,NULL,'birth_date','Fecha de Nacimiento','date',NULL,0,1,1,NULL,NULL,7,'2025-12-27 22:30:58','2025-12-28 03:49:27',1,'clients_profiles','DATE',1),
(19,NULL,'company_name','Empresa','text',NULL,0,1,1,NULL,NULL,8,'2025-12-27 22:30:58','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',1),
(20,NULL,'contract_number','Número de Contrato','text',NULL,0,1,0,NULL,NULL,9,'2025-12-27 22:30:58','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(50)',1),
(21,NULL,'sede','Sede','text',NULL,0,1,1,NULL,NULL,10,'2025-12-27 22:30:58','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(100)',1),
(22,NULL,'grupo','Grupo','text',NULL,0,1,1,NULL,NULL,11,'2025-12-27 22:30:58','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(50)',1),
(23,NULL,'address','Dirección','textarea',NULL,0,1,1,NULL,NULL,12,'2025-12-27 22:30:58','2025-12-28 03:49:27',0,'clients_profiles','TEXT',1),
(24,NULL,'notes','Notas','textarea',NULL,0,1,0,NULL,NULL,13,'2025-12-27 22:30:58','2025-12-28 03:49:27',0,'clients_profiles','TEXT',1),
(25,1,'sat_password','Contraseña SAT','text',NULL,1,1,0,NULL,NULL,4,'2025-12-28 01:51:14','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(26,1,'firma_electronica','Firma Electrónica','text',NULL,1,1,1,NULL,NULL,5,'2025-12-28 01:57:31','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(27,1,'birth_date','Fecha de Nacimiento','date',NULL,1,1,1,NULL,NULL,7,'2025-12-28 01:57:33','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(28,1,'phone_number','Teléfono','phone',NULL,1,1,1,NULL,NULL,6,'2025-12-28 01:57:34','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(29,1,'company_name','Empresa','text',NULL,0,1,1,NULL,NULL,8,'2025-12-28 01:57:43','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(30,1,'contract_number','Número de Contrato','text',NULL,1,1,1,NULL,NULL,9,'2025-12-28 01:57:46','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(31,1,'notes','Notas','textarea',NULL,1,1,1,NULL,NULL,13,'2025-12-28 01:57:48','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(32,1,'address','Dirección','textarea',NULL,1,1,1,NULL,NULL,12,'2025-12-28 01:57:50','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(33,1,'grupo','Grupo','text',NULL,1,1,1,NULL,NULL,11,'2025-12-28 01:57:51','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(34,1,'sede','Sede','text',NULL,1,1,1,NULL,NULL,10,'2025-12-28 01:57:52','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(35,3,'firma_electronica','Firma Electrónica','text',NULL,1,1,1,NULL,NULL,5,'2025-12-28 02:16:27','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(38,3,'contract_number','Número de Contrato','text',NULL,1,1,1,NULL,NULL,9,'2025-12-28 02:38:46','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(39,3,'notes','Notas','textarea',NULL,1,1,1,NULL,NULL,13,'2025-12-28 02:38:54','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(40,3,'address','Dirección','textarea',NULL,1,1,1,NULL,NULL,12,'2025-12-28 02:38:57','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(41,3,'grupo','Grupo','text',NULL,1,1,1,NULL,NULL,11,'2025-12-28 02:38:58','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(42,3,'sede','Sede','text',NULL,1,1,1,NULL,NULL,10,'2025-12-28 02:38:59','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(43,3,'company_name','Empresa','text',NULL,1,1,1,NULL,NULL,8,'2025-12-28 02:39:00','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(44,3,'birth_date','Fecha de Nacimiento','date',NULL,1,1,1,NULL,NULL,7,'2025-12-28 02:39:01','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(45,3,'phone_number','Teléfono','phone',NULL,1,1,1,NULL,NULL,6,'2025-12-28 02:39:02','2025-12-28 03:49:27',0,'clients_profiles','VARCHAR(255)',0),
(57,NULL,'full_name','Nombre Completo','text',NULL,1,1,1,NULL,NULL,1,'2025-12-28 03:49:27','2025-12-28 03:49:27',1,'users',NULL,0),
(58,NULL,'email','Correo Electrónico','email',NULL,1,1,1,NULL,NULL,2,'2025-12-28 03:49:27','2025-12-28 03:49:27',1,'users',NULL,0),
(59,NULL,'nit','NIT','text',NULL,1,1,1,NULL,NULL,3,'2025-12-28 03:49:27','2025-12-28 03:49:27',1,'users',NULL,0),
(60,1,'full_name','Nombre Completo','text',NULL,1,1,1,NULL,NULL,1,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(61,3,'full_name','Nombre Completo','text',NULL,1,1,1,NULL,NULL,1,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(62,4,'full_name','Nombre Completo','text',NULL,1,1,1,NULL,NULL,1,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(63,1,'email','Correo Electrónico','email',NULL,1,1,1,NULL,NULL,2,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(64,3,'email','Correo Electrónico','email',NULL,1,1,1,NULL,NULL,2,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(65,4,'email','Correo Electrónico','email',NULL,1,1,1,NULL,NULL,2,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(66,1,'nit','NIT','text',NULL,1,1,1,NULL,NULL,3,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(67,3,'nit','NIT','text',NULL,1,1,1,NULL,NULL,3,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0),
(68,4,'nit','NIT','text',NULL,1,1,1,NULL,NULL,3,'2025-12-28 03:50:12','2025-12-28 03:50:12',0,'clients_profiles','VARCHAR(255)',0);
/*!40000 ALTER TABLE `client_profile_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_ratings`
--

DROP TABLE IF EXISTS `client_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `rated_by_user_id` int(11) NOT NULL,
  `related_invoice_id` int(11) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL,
  `remarks` text DEFAULT NULL,
  `rating_date` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_user_id` (`client_user_id`),
  KEY `rated_by_user_id` (`rated_by_user_id`),
  KEY `related_invoice_id` (`related_invoice_id`),
  CONSTRAINT `client_ratings_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_ratings_ibfk_2` FOREIGN KEY (`rated_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `client_ratings_ibfk_3` FOREIGN KEY (`related_invoice_id`) REFERENCES `monthly_invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_ratings`
--

LOCK TABLES `client_ratings` WRITE;
/*!40000 ALTER TABLE `client_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_service_priorities`
--

DROP TABLE IF EXISTS `client_service_priorities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_service_priorities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `client_user_id` int(11) NOT NULL,
  `service_id` int(11) DEFAULT NULL,
  `priority` enum('baja','normal','alta','urgente') DEFAULT 'normal',
  `notes` text DEFAULT NULL,
  `created_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_client_service_priority` (`client_user_id`,`service_id`),
  KEY `service_id` (`service_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `idx_priorities_workspace` (`workspace_id`),
  CONSTRAINT `client_service_priorities_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_service_priorities_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_service_priorities_ibfk_3` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Prioridades específicas de servicios para clientes';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_service_priorities`
--

LOCK TABLES `client_service_priorities` WRITE;
/*!40000 ALTER TABLE `client_service_priorities` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_service_priorities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_services`
--

DROP TABLE IF EXISTS `client_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `client_user_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `custom_price` decimal(10,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `deactivation_reason` text DEFAULT NULL COMMENT 'Motivo por el cual el servicio fue desactivado para este cliente',
  `deactivated_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha y hora en que el servicio fue desactivado',
  `deactivated_by_user_id` int(11) DEFAULT NULL COMMENT 'ID del admin/employee que desactivó el servicio',
  `is_subscribed` tinyint(1) DEFAULT 0,
  `subscription_start_date` date DEFAULT NULL,
  `subscription_end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `client_user_id` (`client_user_id`),
  KEY `service_id` (`service_id`),
  KEY `fk_service_deactivated_by` (`deactivated_by_user_id`),
  KEY `idx_client_services_status` (`status`),
  KEY `idx_cs_workspace` (`workspace_id`),
  CONSTRAINT `client_services_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `client_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_service_deactivated_by` FOREIGN KEY (`deactivated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_services`
--

LOCK TABLES `client_services` WRITE;
/*!40000 ALTER TABLE `client_services` DISABLE KEYS */;
INSERT INTO `client_services` VALUES
(5,NULL,4,8,NULL,NULL,'active','2025-12-28 07:24:23',NULL,NULL,NULL,0,NULL,NULL),
(6,NULL,5,8,NULL,NULL,'active','2025-12-28 07:24:23',NULL,NULL,NULL,0,NULL,NULL),
(7,NULL,6,8,NULL,NULL,'active','2025-12-28 07:24:23',NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `client_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients_profiles`
--

DROP TABLE IF EXISTS `clients_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients_profiles` (
  `user_id` int(11) NOT NULL,
  `workspace_id` int(11) DEFAULT NULL,
  `contract_number` varchar(50) DEFAULT NULL,
  `sat_password_encrypted` varchar(255) DEFAULT NULL,
  `firma_electronica` varchar(255) DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `overall_rating` decimal(3,2) DEFAULT 5.00,
  `notes` text DEFAULT NULL,
  `ratings_count` int(11) DEFAULT 0 COMMENT 'Cantidad de ratings promediados en overall_rating',
  `active_infractions_count` int(11) DEFAULT 0 COMMENT 'Número de infracciones activas del cliente',
  `sede` varchar(100) DEFAULT NULL COMMENT 'Sede del cliente (ej: Mazatenango, Guatemala, etc.)',
  `grupo` varchar(50) DEFAULT NULL COMMENT 'Grupo del cliente para organización y filtrado',
  `company_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `account_balance` decimal(10,2) DEFAULT 0.00 COMMENT 'Saldo actual del cliente',
  PRIMARY KEY (`user_id`),
  KEY `idx_sede` (`sede`),
  KEY `idx_grupo` (`grupo`),
  KEY `idx_cp_workspace` (`workspace_id`),
  CONSTRAINT `clients_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients_profiles`
--

LOCK TABLES `clients_profiles` WRITE;
/*!40000 ALTER TABLE `clients_profiles` DISABLE KEYS */;
INSERT INTO `clients_profiles` VALUES
(3,3,'765','reneMaradiaga29_',NULL,'5569-4236',NULL,5.00,NULL,0,2,'Central','2',NULL,NULL,75.00),
(4,3,'801','Provial4ever.',NULL,'5705-1003',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(5,3,'653','Carlos1989*',NULL,'4723-6512',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(6,3,'663','Batres333+',NULL,'4256-2712  4008-1283',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(7,3,'276','Nico2023*',NULL,'5484-2627',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','2',NULL,NULL,0.00),
(8,3,'225','Lvmi2013',NULL,'4124-2554',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(9,3,'781','Alejandra#1999',NULL,'3399-4000',NULL,5.00,NULL,0,0,'San cristobal','2',NULL,NULL,0.00),
(10,3,'955','1995_Mynor',NULL,'3255-4886',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(11,3,'645','Luca*123',NULL,'4071-6032',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(12,3,'743','Lopez2001##',NULL,'5204-9635',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(13,3,'845','Ever2216#',NULL,'5567-1479',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','1',NULL,NULL,0.00),
(14,3,'1445','Jpineda003@',NULL,'3847-5603',NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(15,3,'721','Angelaguilar@140405',NULL,'5694-2513',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(16,3,'857','Rudiman92_',NULL,'5870-1656',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','2',NULL,NULL,0.00),
(17,3,'913','Maurilio_23/',NULL,'5356-5742',NULL,5.00,NULL,0,0,'Palin','1',NULL,NULL,0.00),
(18,3,'744','24111992@udY',NULL,'5597-8686',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(19,3,'872','Rogelio.2000',NULL,'3647-4040',NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(20,3,'778','Freiser2023*',NULL,'5133-4314',NULL,5.00,NULL,0,0,'San cristobal','2',NULL,NULL,0.00),
(21,3,'934','Miguel2002.',NULL,'4882-3679',NULL,5.00,NULL,0,0,'Palin','2',NULL,NULL,0.00),
(22,3,'466','Gerber1229@',NULL,'4699-6483',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','1',NULL,NULL,0.00),
(23,3,'730','Ramirez1997#',NULL,'3388-4681',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(24,3,'512','Rivera2019',NULL,'3158-9395',NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','2',NULL,NULL,0.00),
(25,3,'910','Jhonatan1998jj$25',NULL,'3825-1704',NULL,5.00,NULL,0,0,'Palin','1',NULL,NULL,0.00),
(26,3,'291','Salanic_2003',NULL,'3621 2034',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','2',NULL,NULL,0.00),
(27,3,'373','Sat.12345',NULL,'3606-2765 3596-3556',NULL,5.00,NULL,0,0,'Palin','1',NULL,NULL,0.00),
(28,3,'487','Abner2004#',NULL,'3825-7890',NULL,5.00,NULL,0,0,'Peten/potun','1',NULL,NULL,0.00),
(29,3,'429','Edison31.',NULL,'4636-1594',NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','1',NULL,NULL,0.00),
(30,3,'431','Fredy@123',NULL,'5195-0679',NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','2',NULL,NULL,0.00),
(31,3,'848','Carlos1998.',NULL,'3637-7417',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','1',NULL,NULL,0.00),
(32,3,'656','Lopez1995',NULL,'5699-5587',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(33,3,'202','Jesus_*123?/',NULL,'3720-6525',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(34,3,'672','Elman2023*',NULL,'51166933',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(35,3,'859','Lopez2001$',NULL,'3602-0633',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','2',NULL,NULL,0.00),
(36,3,'904','Axel1999*',NULL,'4498-3421',NULL,5.00,NULL,0,0,'Palin','1',NULL,NULL,0.00),
(37,3,'810','Vinicio2002.',NULL,'4616-2026',NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','1',NULL,NULL,0.00),
(38,3,'534','Baltazar2003.',NULL,'4020-6225',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(39,3,'524','RonaldCardona2001.',NULL,'5578-5854',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(40,3,'808','Orlando93',NULL,'3541-3889',NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','1',NULL,NULL,0.00),
(41,3,'649','67329090Eddy@',NULL,'3589-3079',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(42,3,'538','carlos1990H?',NULL,'5874-4968',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(43,3,'515','William@2023',NULL,'4175-5486',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(44,3,'670','Wilson2002*',NULL,'3963-2005',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(45,3,'871','Anibal2025*',NULL,'5112-3170',NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(46,3,'508','Franco1997#',NULL,'4693-1714',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(47,3,'505','Esther1208@',NULL,'4935-0665',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(48,3,'956','Chapa19086.',NULL,'3881-9041',NULL,5.00,NULL,0,0,'Peten/potun','1',NULL,NULL,0.00),
(49,3,'660','Jose5568',NULL,'5490-2851',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(50,3,'**','Cris2023.',NULL,'4274-0990',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(51,3,'867','Jerson.1989',NULL,'5903-9718',NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(52,3,'893','Valdez1234/',NULL,'4240-4615',NULL,5.00,NULL,0,0,'Peten/potun','2',NULL,NULL,0.00),
(53,3,'881','Edwin2000#',NULL,'5368-5966',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','2',NULL,NULL,0.00),
(54,3,'891','Maynorvela14@',NULL,'5057 6877',NULL,5.00,NULL,0,0,'Peten/potun','1',NULL,NULL,0.00),
(55,3,'722','Donis2018',NULL,'4155-3173',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(56,3,'889','Omar3748#',NULL,'3748-3485',NULL,5.00,NULL,0,0,'Peten/potun','1',NULL,NULL,0.00),
(57,3,'775','Vasti2001*',NULL,'4750-9255',NULL,5.00,NULL,0,0,'San cristobal','2',NULL,NULL,0.00),
(58,3,'289','Navarro2023*',NULL,'4066-9538',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','2',NULL,NULL,0.00),
(59,3,'509','Marroquin1999*',NULL,'4599-9364',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(60,3,'657','Edilson.2002',NULL,'5369-2516',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(61,3,'640','Katerin%2003',NULL,'4674-5040',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(62,3,'829','Lopez1985',NULL,'4680-8161',NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','1',NULL,NULL,0.00),
(63,3,'828','Gmsfmp2131#',NULL,'3795-5360',NULL,5.00,NULL,0,0,'Coatepeque','1',NULL,NULL,0.00),
(64,3,'718','Ponciano#1237',NULL,'4272-5065',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(65,3,'294','Garza2000$',NULL,'4186-3321',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','2',NULL,NULL,0.00),
(66,3,'648','Aliceflores18@',NULL,'5326-3568',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(67,3,'671','Rancho123*',NULL,'4953-8179',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(68,3,'720','Eber2001_',NULL,'5373-2087',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(69,3,'742','Jasmine2001#',NULL,'4188-0987',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(70,3,'1094','Luis2203#',NULL,'5384-6645',NULL,5.00,NULL,0,0,'San cristobal','2',NULL,NULL,0.00),
(71,3,'715','Gjaviche.235',NULL,'3613-9826',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(72,3,'711','Juan123,',NULL,'3577-8820',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(73,3,'369','Jose1997',NULL,'5543-1357',NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(74,3,'523','Fabiola.0077',NULL,'5066 9645',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(75,3,'401','Alex2018',NULL,'3136-9180',NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','2',NULL,NULL,0.00),
(76,3,'1410','513210Cesar.',NULL,'4757 3826',NULL,5.00,NULL,0,0,'Coatepeque','2',NULL,NULL,0.00),
(77,3,'1454','ArecaX1@',NULL,'5832 2058',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','1',NULL,NULL,0.00),
(78,3,'790','Bayron1994*',NULL,'4011 5109',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','1',NULL,NULL,0.00),
(79,3,'535','Ivan1984.',NULL,'4734-4446',NULL,5.00,NULL,0,0,'Coatepeque','2',NULL,NULL,0.00),
(80,3,'1315','German2004*',NULL,'4687-6848',NULL,5.00,NULL,0,0,'Peten/potun','2',NULL,NULL,0.00),
(81,3,'868','Cristian2208',NULL,'4522-2627',NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(82,3,'752','Barrientos2013',NULL,'4076-2926',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(83,3,'667','Arana.2000',NULL,'46630110',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(84,3,'647','Darwin3429*',NULL,'3184-7239',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(85,3,'795','Andre2021*',NULL,'3118-6240',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(86,3,'842','Colindres.2022',NULL,'4638-0561',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','1',NULL,NULL,0.00),
(87,3,'750','Madelyn@2026',NULL,'3778-7290',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(88,3,'1291','Pearlharbor.12',NULL,'4167-0160',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(89,3,'763','Helengarcia.2004',NULL,'4170-9333',NULL,5.00,NULL,0,0,'San cristobal','1',NULL,NULL,0.00),
(90,3,'858','Lili2023.',NULL,'3951-3836',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','2',NULL,NULL,0.00),
(91,3,'791','Marcela2001*',NULL,'3216-8482',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','2',NULL,NULL,0.00),
(92,3,'762','Estefany%2004',NULL,'4989-4476',NULL,5.00,NULL,0,0,'San cristobal','1',NULL,NULL,0.00),
(93,3,'788','2001#Barrios',NULL,'3293 1814',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','1',NULL,NULL,0.00),
(94,3,'654','Gemela1318*',NULL,'3179 7908',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(96,3,'131','Herrarte#0610',NULL,'4262 0198',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(97,3,'922','David@1989',NULL,'5564 9867',NULL,5.00,NULL,0,0,'Palin','2',NULL,NULL,0.00),
(98,3,'525','#AlexandeR1902',NULL,'4153-9193',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(99,3,'406','Bailon2019',NULL,'5427-2580',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(100,3,'662','Indira30%',NULL,'47465707',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(102,3,'222','Arriaza02#*',NULL,'5066 7118',NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(103,3,NULL,'Walter1985#',NULL,'4641-8675',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(106,3,'1448','Edgar1992',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(108,3,NULL,'Jefry1007/*',NULL,'32566673',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(109,3,NULL,'Herberttash1995',NULL,'5431 5773',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(111,3,'1044','Remixa123!',NULL,'3594 0504',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(112,3,'851','Esquivel1998',NULL,'5326 1560',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','2',NULL,NULL,0.00),
(113,3,'267','Beverlin1999*',NULL,'5497 7333',NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','2',NULL,NULL,0.00),
(114,3,'771','Rivera1984#',NULL,'4805 7166',NULL,5.00,NULL,0,0,'San cristobal','2',NULL,NULL,0.00),
(115,3,'664','Mario0107*',NULL,'4009 3489',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(116,3,'665','Maria2023*',NULL,'5578 4641',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(117,3,'1413','Pablo2000*',NULL,'3235 9804',NULL,5.00,NULL,0,0,'Coatepeque','1',NULL,NULL,0.00),
(118,3,'774','Sergio1997',NULL,'3144 8745',NULL,5.00,NULL,0,0,'San cristobal','2',NULL,NULL,0.00),
(119,3,'658','Manolo1998*',NULL,'3600 2042',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(120,3,'655','Amalio1993*',NULL,'3097 2268',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(121,3,'843','FMelgar1985',NULL,'3734 8885',NULL,5.00,NULL,0,0,'Morales/Puerto barrios','1',NULL,NULL,0.00),
(122,3,'924','Ander1997*',NULL,'3156 3395',NULL,5.00,NULL,0,0,'Palin','2',NULL,NULL,0.00),
(126,3,'omiso 52,50 dici 23','Valent1n4@123',NULL,NULL,NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(132,3,'864','Kylevidal2019.',NULL,NULL,NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(133,3,'911','Omer2000*',NULL,NULL,NULL,5.00,NULL,0,0,'Palin','1',NULL,NULL,0.00),
(137,3,NULL,'1049ME513@',NULL,NULL,NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(143,3,'751','Gilma1996@',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(147,3,'638','Rudy1994%',NULL,NULL,NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(148,3,'637','Caste2022*',NULL,NULL,NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(149,3,'516','55880519Kj*',NULL,NULL,NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(150,3,'635','Dony1991.',NULL,NULL,NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(151,3,'644','Mario2474*',NULL,NULL,NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(152,3,'765','Evelyn.1234',NULL,NULL,NULL,5.00,NULL,0,0,'San cristobal','1',NULL,NULL,0.00),
(153,3,'757','Walter.11*',NULL,NULL,NULL,5.00,NULL,0,0,'San cristobal','1',NULL,NULL,0.00),
(154,3,'766','Melissa-98',NULL,NULL,NULL,5.00,NULL,0,0,'San cristobal','1',NULL,NULL,0.00),
(155,3,'840','Nueva123*',NULL,NULL,NULL,5.00,NULL,0,0,'Morales/Puerto barrios','1',NULL,NULL,0.00),
(156,3,'866','Ronaldo.2004',NULL,NULL,NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(157,3,'669','Minor90.@',NULL,NULL,NULL,5.00,NULL,0,0,'Rio Dulce','1',NULL,NULL,0.00),
(158,3,'909','Color_azul1k',NULL,NULL,NULL,5.00,NULL,0,0,'Palin','1',NULL,NULL,0.00),
(159,3,'786','Chispas2003_',NULL,NULL,NULL,5.00,NULL,0,0,'Mazatenango/ san bernandino suchitepequez','1',NULL,NULL,0.00),
(160,3,'807','Alex_2020',NULL,NULL,NULL,5.00,NULL,0,0,'Quetzaltenango/salcaja','1',NULL,NULL,0.00),
(161,3,'706','Guatemala2023!!',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(162,3,'703','Franklin2000R',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(163,3,'704','Abner.1998',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(164,3,'532','YESENIA.2021',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(165,3,'702','Salazar@49',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(166,3,'737','Josue2023*',NULL,NULL,NULL,5.00,NULL,0,0,'Central','2',NULL,NULL,0.00),
(167,3,'770','Santos2001*',NULL,NULL,NULL,5.00,NULL,0,0,'San cristobal','2',NULL,NULL,0.00),
(168,3,'833','Mireya.1996',NULL,NULL,NULL,5.00,NULL,0,0,'Coatepeque','2',NULL,NULL,0.00),
(169,3,'986','Lindsay2004#',NULL,'32756760',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(170,3,'1012','Lopez1002#',NULL,'55744603',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(171,3,'1002','Alonzo2002#',NULL,'42671529',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(172,3,'987','Bateria3430$',NULL,'42138828',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(174,3,'983','Alan@2301',NULL,'47840490',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(175,3,'1000','Cuilapa0102$',NULL,'45001850',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(176,3,'980','Keyri1997_',NULL,'40630465',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(177,3,'1038','Arias1994',NULL,'45269859',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(178,3,'959','Jose2000',NULL,'54579752',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(179,3,'1027','Bolvito123*',NULL,'42856024',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(180,3,'1039','Boteo25*',NULL,'42669022',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(181,3,'1040','Davila2000@',NULL,'39599186',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(182,3,'968','Edgar1995*',NULL,'40954775',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(183,3,'979','Cardona1992.',NULL,'38411748',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(184,3,'973','Cesar2002/*',NULL,'55747056',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(185,3,'1046','Carlos1993$',NULL,'38180818',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(186,3,'1053','Joselyn1995*',NULL,'57184256',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(187,3,'1050','Cazun2000.',NULL,'40813032',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(188,3,'1052','Jere2001$',NULL,'42693607',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(189,3,'975','Chu1997%',NULL,'46604035',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(190,3,'1042','Lfcorado2004$',NULL,'51907035',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(191,3,'1047','Cordova2005#',NULL,'4280 3126',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(192,3,'967','Coronado2002*',NULL,'57842020',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(193,3,'976','Manuel2000#',NULL,'44910406   50091139',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(194,3,'1048','Hugoadrian829@',NULL,'54766487',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(195,3,'1051','Damaris1999*',NULL,'31200263',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(196,3,'1061','Cuyuch1992@',NULL,'44336034',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(197,3,'1009','Manuel123.',NULL,'54857974',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(198,3,'977','Sonia*2004',NULL,'44837345',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(199,3,'1041','Elfegoesteban2003*',NULL,'54980513',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(200,3,'1005','Divas788787!',NULL,'58279773',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(201,3,'1055','Cima1947*',NULL,'39953131',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(202,3,'991','5733ESDRAS5979i*#',NULL,'57335979',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(203,3,'988','Cristian@98',NULL,'41990514',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(204,3,'1043','Obed2003#',NULL,'47098303',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(205,3,'1033','Elmer1992*',NULL,'59236079',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(206,3,'1071','Ingrid2002#',NULL,'3148 3721',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(207,3,'1014','Lesly.1998',NULL,'50081209',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(208,3,'1001','Ingrid1998*',NULL,'42415146',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(209,3,'1010','Jaime1992@',NULL,'33006841',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(210,3,'1037','Hernandez1*',NULL,'39930945',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(211,3,'1068','Jenry2000',NULL,'55704977',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(212,3,'1066','Garcia2025.',NULL,'59336047',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(213,3,'989','Garcia2212*',NULL,'32654202',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(214,3,'1035','Matul/1992',NULL,'30118319',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(215,3,'971','Keilor2220/',NULL,'31539529',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(216,3,'970','Godoy2746*',NULL,'33361931',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(217,3,'1074','Gomez2207*',NULL,'53736621',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(218,3,'958','300996Wawii.',NULL,'58510277',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(219,3,'950','Mario1998#',NULL,'33958685',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(220,3,'969','Rodbil1993#',NULL,'30531235',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(221,3,'1054','57220310123aA$',NULL,'59529348',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(222,3,'1067','Ivannayas07.',NULL,'42262824',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(223,3,'996','Herrera01-',NULL,'38601918',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(224,3,'995','Herrera16',NULL,'33427295',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(225,3,'1057','Estrada.2003',NULL,'42610066',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(226,3,'997','Josue1993*',NULL,'36247765',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(227,3,'985','Fjochola2004_',NULL,'43917187',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(228,3,'1049','Mia.2025',NULL,'53189084',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(229,3,'1073','Yoyi2003#',NULL,'48452491',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(230,3,'1025','Lemus1998#',NULL,'41419651',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(231,3,'974','Guate1234.',NULL,'41509173',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(232,3,'978','@Glendita2001',NULL,'47110502',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(233,3,'1036','Lopez1204*',NULL,'57299934',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(234,3,'1022','Pablosat.21',NULL,'42628073',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(235,3,'962','Rodriguez02#',NULL,'55325528',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(236,3,'1026','Marco1994',NULL,'57577956',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(237,3,'964','123Santo.',NULL,'4803-4805',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(238,3,'951','Mireya.2020',NULL,'39955622',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(239,3,'1017','Ylin2131.g',NULL,'35883421',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(240,3,'960','Leonel1995',NULL,'36740687',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(241,3,'961','Katerine1997#',NULL,'47067597',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(242,3,'1004','Katherin2002.',NULL,'57144829',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(243,3,'953','Henry3429*',NULL,'57695137',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(244,3,'1003','Jenner4075.',NULL,'40755029',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(245,3,'1060','Enry2025*',NULL,'40926678',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(246,3,'1032','Flor1991@.',NULL,'37926562',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(247,3,'1085','Molina1997',NULL,'47007589',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(248,3,'1030','Juancho2003@',NULL,'56279737',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(249,3,'957','Lester*1995',NULL,'59844756',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(250,3,'1029','Vivian2217',NULL,'33920162',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(251,3,'1075','Joel2001*',NULL,'55828543',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(252,3,'955','Erick.77',NULL,'55358736',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(253,3,'963','Ove3232+',NULL,'32323332',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(254,3,'1021','María2206',NULL,'41923733',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(255,3,'1028','Nancy2023*',NULL,'47786019',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(256,3,'1018','Pablo1999*',NULL,'38755383',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(257,3,'1069','Paredes2707.',NULL,'4065-6048',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(258,3,'1086','Jose1996$',NULL,'39561117',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(259,3,'1006','Penate2004.',NULL,'47952022',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(260,3,'1072','Edgar1997#',NULL,'45203917',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(261,3,'1056','Marlon1994*',NULL,'36651663',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(262,3,'1058','Perez2000*',NULL,'3379 6440',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(263,3,'952','Jose.2002',NULL,'48298495',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(264,3,'999','Joel1995_',NULL,'53975019',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(265,3,'1016','Quevedo520#',NULL,'49809088',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(266,3,'1019','Victor.2024',NULL,'5579-8966',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(267,3,'998','Edenilson#2005',NULL,'57245781',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(268,3,'956','Rivera51154853#',NULL,'51154853',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(269,3,'1020','Carlos99.',NULL,'40605253',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(270,3,'1062','Xavy199627.',NULL,'42830804',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(271,3,'954','Romero2002.',NULL,'39684821',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(272,3,'1065','Rosario2005*',NULL,'3262 4507',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(273,3,'965','Mishel1999#',NULL,'55564646',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(274,3,'984','Sandoval1992#',NULL,'47025411',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(275,3,'994','Claudia2000#',NULL,'31978049',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(276,3,'1011','Veronica2005*',NULL,'31616849',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(277,3,'949','Carlos123abc.',NULL,'49589820',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(278,3,'1008','Mayda-1989',NULL,'56239255',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(279,3,'1064','Denis2004*',NULL,'57574073',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(280,3,'1063','Tob123**',NULL,'40789285',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(281,3,'1013','*Mendoza277',NULL,'47461233',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(282,3,'1034','Juan3310',NULL,'38070018',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(283,3,'966','Tuells2005@',NULL,'5551 8095',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(284,3,'1023','Tupas2021*',NULL,'50135104',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(285,3,'982','Hernandez1998#',NULL,'41905740',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(286,3,'1015','Colocho1',NULL,'46075888',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(287,3,'972','Yesica2021',NULL,'46672788',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(288,3,'992','Ezequiel.2003',NULL,'49604522',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(289,3,'990','Manolovi97@',NULL,'55870897',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(290,3,'1007','Josue1995#',NULL,'58578292',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(291,3,'993','Villatoroluis@21',NULL,'30297347',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(292,3,'1087','Kevin.1993',NULL,'32477423',NULL,5.00,NULL,0,0,'Central','1',NULL,NULL,0.00),
(296,3,'514','482470Ma',NULL,'4041-1536',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(297,3,'735','Salvador.1983',NULL,'4777-7741',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(298,3,'***','Marcelino19',NULL,'3578-0415',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(299,3,'-2023-029-PROVIAL','Oscar1995',NULL,'4629-9360',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(300,3,'631','Anamary4466',NULL,'3355 7716',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(301,3,'510','Anavisca1990',NULL,'4186-6819',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(302,3,'35-2022-029-PROVIAL.','Norma.1949',NULL,'5821-4838',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(312,3,'572','Oscar1974',NULL,'53861772',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(313,3,'570','Ant2025$$:p',NULL,'5453 4166',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(315,3,'579','Jorge.1997',NULL,'5729-5583 3972-5719',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(316,3,'571','Marlon.1997',NULL,'5581-0390',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(317,3,NULL,'Guate.2022',NULL,'nogueraaroche11@gmail.com',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(319,3,'Firma Electronica','Nit',NULL,'Fecha de nacimiento',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(320,3,'482470Ma$','100431925',NULL,'36478',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(321,3,'Salvador.1983$','48861537',NULL,'30641',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(322,3,'Anamary4466$','44667531',NULL,'29355',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(323,3,'Anavisca1990$','92815774',NULL,'32980',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(324,3,'Oscar1974$','16639596',NULL,'27364',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(325,3,'Antonio1960$','19452713',NULL,'22120',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(326,3,'Jorge/1997','109904893',NULL,'35710',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(327,3,'Marlon.1997$','99292149',NULL,'35527',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(328,3,'Marcelino19$','49779214',NULL,'32481',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(329,3,'guate.2022','7129459',NULL,'24355',NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(333,3,'629','Castillo1992#',NULL,'69242984',NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(334,3,'838','Rubi123.',NULL,'3679 2020',NULL,5.00,NULL,0,0,'Morales/Puerto barrios',NULL,NULL,NULL,0.00),
(335,3,NULL,NULL,NULL,NULL,NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(336,3,'734','Santos2020.',NULL,NULL,NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(337,3,'***','Barillas1993',NULL,NULL,NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(338,3,'863','Edygarcia1352',NULL,NULL,NULL,5.00,NULL,0,0,'Rio Dulce',NULL,NULL,NULL,0.00),
(339,3,'569','Ricardo.2002*',NULL,NULL,NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(340,3,'844','Julio2020.',NULL,NULL,NULL,5.00,NULL,0,0,'Morales/Puerto barrios',NULL,NULL,NULL,0.00),
(341,3,'1231','Fabio&1234',NULL,NULL,NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(342,3,'576','Josue1998',NULL,NULL,NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(343,3,'1091','Betzabe.2018',NULL,NULL,NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00),
(344,3,'944','Habdalayunes96.',NULL,NULL,NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(345,3,'1090','@Alejandra2007',NULL,NULL,NULL,5.00,NULL,0,0,NULL,NULL,NULL,NULL,0.00),
(346,3,'1077','Melvin/1998',NULL,NULL,NULL,5.00,NULL,0,0,'Central',NULL,NULL,NULL,0.00);
/*!40000 ALTER TABLE `clients_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#6B7280',
  `workspace_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name_workspace` (`name`,`workspace_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `idx_workspace` (`workspace_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `expense_categories_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expense_categories_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES
(1,'Nómina','Pagos a empleados y colaboradores','#3B82F6',NULL,1,NULL,'2025-12-26 18:04:25','2025-12-26 18:04:25'),
(2,'Servicios Públicos','Agua, luz, internet, teléfono','#10B981',NULL,0,NULL,'2025-12-26 18:04:25','2025-12-27 03:29:00'),
(3,'Alquiler','Renta de oficinas y espacios','#8B5CF6',NULL,1,NULL,'2025-12-26 18:04:25','2025-12-26 18:04:25'),
(4,'Suministros','Materiales de oficina y consumibles','#F59E0B',NULL,1,NULL,'2025-12-26 18:04:25','2025-12-26 18:04:25'),
(5,'Transporte','Combustible, viáticos, envíos','#EF4444',NULL,1,NULL,'2025-12-26 18:04:25','2025-12-26 18:04:25'),
(6,'Tecnología','Software, hardware, suscripciones','#6366F1',NULL,1,NULL,'2025-12-26 18:04:25','2025-12-26 18:04:25'),
(7,'Impuestos','Obligaciones fiscales','#DC2626',NULL,0,NULL,'2025-12-26 18:04:25','2025-12-27 03:28:50'),
(8,'Marketing','Publicidad y promociones','#EC4899',NULL,0,NULL,'2025-12-26 18:04:25','2025-12-27 03:28:54'),
(9,'Seguros','Pólizas y coberturas','#14B8A6',NULL,0,NULL,'2025-12-26 18:04:25','2025-12-27 03:28:57'),
(10,'Capacitación','Cursos y formación','#8B5CF6',NULL,0,NULL,'2025-12-26 18:04:25','2025-12-27 03:28:47'),
(11,'Mantenimiento','Reparaciones y mantenimiento','#F97316',NULL,1,NULL,'2025-12-26 18:04:25','2025-12-26 18:04:25'),
(12,'Otros','Gastos no categorizados','#6B7280',NULL,1,NULL,'2025-12-26 18:04:25','2025-12-26 18:04:25'),
(13,'Luz',NULL,'#6B7280',1,0,1,'2025-12-27 03:31:23','2025-12-27 03:31:42'),
(16,'Mujeres',NULL,'#6B7280',NULL,1,1,'2025-12-27 16:41:22','2025-12-27 16:41:22'),
(17,'categoria general',NULL,'#6B7280',1,0,1,'2025-12-27 16:59:06','2025-12-27 16:59:57'),
(18,'categoria provial',NULL,'#6B7280',3,1,1,'2025-12-27 17:00:06','2025-12-27 17:00:06');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `expense_type` enum('one_time','monthly_recurring') NOT NULL COMMENT 'one_time=gasto único, monthly_recurring=gasto mensual recurrente',
  `description` text NOT NULL COMMENT 'Descripción del gasto (ej: "Pago a trabajador A", "Compra de artículos")',
  `amount` decimal(10,2) NOT NULL COMMENT 'Monto del gasto',
  `expense_date` date NOT NULL COMMENT 'Fecha del gasto',
  `expense_month` int(11) NOT NULL COMMENT 'Mes del gasto (1-12) para reportes',
  `expense_year` int(11) NOT NULL COMMENT 'Año del gasto para reportes',
  `category` varchar(100) DEFAULT NULL COMMENT 'Categoría del gasto (ej: "Nómina", "Suministros", "Servicios")',
  `created_by_user_id` int(11) NOT NULL COMMENT 'Admin que registró el gasto',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Si el gasto está activo (para gastos recurrentes que pueden cancelarse)',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_shared` tinyint(1) DEFAULT 0 COMMENT 'TRUE si es gasto compartido entre workspaces',
  `category_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `idx_date` (`expense_date`),
  KEY `idx_month_year` (`expense_year`,`expense_month`),
  KEY `idx_type` (`expense_type`),
  KEY `idx_active` (`is_active`),
  KEY `idx_expenses_workspace` (`workspace_id`),
  KEY `idx_category_id` (`category_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Gastos del negocio (únicos o recurrentes)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES
(1,1,'one_time','pago',1.00,'2025-12-27',12,2025,'Nómina',1,1,'2025-12-27 03:42:39','2025-12-27 03:42:39',1,NULL),
(2,1,'one_time','pago local provial',2.00,'2025-12-27',12,2025,'Otros',1,1,'2025-12-27 03:42:58','2025-12-27 03:42:58',0,NULL),
(3,3,'one_time','putas',100.00,'2025-12-27',12,2025,'Mujeres',1,1,'2025-12-27 16:41:44','2025-12-27 16:41:44',0,NULL),
(4,3,'one_time','pago de prueba',40.00,'2025-12-27',12,2025,'Transporte',1,1,'2025-12-27 16:44:33','2025-12-27 16:44:33',0,NULL),
(5,1,'one_time','Pago de planilla - Enero 2025',100.00,'2025-01-30',1,2025,NULL,1,1,'2025-12-28 07:03:25','2025-12-28 07:03:25',0,NULL);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `external_incomes`
--

DROP TABLE IF EXISTS `external_incomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `external_incomes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(50) NOT NULL,
  `workspace_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `income_date` date NOT NULL,
  `source` enum('salary','freelance','investment','rental','other') NOT NULL DEFAULT 'other',
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_tenant_date` (`tenant`,`income_date`),
  KEY `idx_workspace_date` (`workspace_id`,`income_date`),
  CONSTRAINT `external_incomes_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE SET NULL,
  CONSTRAINT `external_incomes_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `external_incomes`
--

LOCK TABLES `external_incomes` WRITE;
/*!40000 ALTER TABLE `external_incomes` DISABLE KEYS */;
INSERT INTO `external_incomes` VALUES
(1,'acme',1,'Ingreso de prueba',250.50,'2025-12-27','freelance','Test desde backend',1,'2025-12-27 19:57:23','2025-12-27 19:57:23'),
(2,'acme',1,'Ingreso de otro negocio',500.00,'2025-01-20','other','Venta de productos externos',1,'2025-12-28 07:14:44','2025-12-28 07:14:44');
/*!40000 ALTER TABLE `external_incomes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitation_code_uses`
--

DROP TABLE IF EXISTS `invitation_code_uses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitation_code_uses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invitation_code_id` int(11) NOT NULL,
  `registered_user_id` int(11) NOT NULL,
  `used_at` timestamp NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `registered_user_id` (`registered_user_id`),
  KEY `idx_code_uses` (`invitation_code_id`),
  CONSTRAINT `invitation_code_uses_ibfk_1` FOREIGN KEY (`invitation_code_id`) REFERENCES `invitation_codes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invitation_code_uses_ibfk_2` FOREIGN KEY (`registered_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitation_code_uses`
--

LOCK TABLES `invitation_code_uses` WRITE;
/*!40000 ALTER TABLE `invitation_code_uses` DISABLE KEYS */;
/*!40000 ALTER TABLE `invitation_code_uses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitation_codes`
--

DROP TABLE IF EXISTS `invitation_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitation_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `workspace_id` int(11) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `max_uses` int(11) DEFAULT NULL COMMENT 'NULL = ilimitado',
  `uses_count` int(11) DEFAULT 0,
  `auto_approve` tinyint(1) DEFAULT 0 COMMENT 'Si TRUE, el cliente queda activo inmediatamente',
  `default_services` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array de service_ids a asignar al registrarse' CHECK (json_valid(`default_services`)),
  `required_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '["nit", "full_name", "password"]' CHECK (json_valid(`required_fields`)),
  `optional_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '["email", "phone_number"]' CHECK (json_valid(`optional_fields`)),
  `name` varchar(100) DEFAULT NULL COMMENT 'Nombre descriptivo para el admin',
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by_user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `workspace_id` (`workspace_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `idx_invitation_code` (`code`),
  KEY `idx_invitation_active` (`is_active`,`expires_at`),
  CONSTRAINT `invitation_codes_ibfk_1` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invitation_codes_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitation_codes`
--

LOCK TABLES `invitation_codes` WRITE;
/*!40000 ALTER TABLE `invitation_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `invitation_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_artifacts`
--

DROP TABLE IF EXISTS `invoice_artifacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_artifacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `artifact_type` varchar(50) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `invoice_artifacts_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `monthly_invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_artifacts`
--

LOCK TABLES `invoice_artifacts` WRITE;
/*!40000 ALTER TABLE `invoice_artifacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_artifacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_files`
--

DROP TABLE IF EXISTS `invoice_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `uploaded_by_user_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `upload_timestamp` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `uploaded_by_user_id` (`uploaded_by_user_id`),
  CONSTRAINT `invoice_files_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `monthly_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_files_ibfk_2` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_files`
--

LOCK TABLES `invoice_files` WRITE;
/*!40000 ALTER TABLE `invoice_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_service_items`
--

DROP TABLE IF EXISTS `invoice_service_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_service_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `invoice_service_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `monthly_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_service_items_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_service_items`
--

LOCK TABLES `invoice_service_items` WRITE;
/*!40000 ALTER TABLE `invoice_service_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_service_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monthly_invoices`
--

DROP TABLE IF EXISTS `monthly_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `monthly_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `client_user_id` int(11) NOT NULL,
  `invoice_year` int(11) NOT NULL,
  `invoice_month` int(11) NOT NULL,
  `previous_debt` decimal(10,2) DEFAULT 0.00,
  `monthly_fee` decimal(10,2) DEFAULT 0.00,
  `extras_fee` decimal(10,2) DEFAULT 0.00,
  `extras_description` text DEFAULT NULL,
  `total_due` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) DEFAULT 0.00,
  `balance` decimal(10,2) NOT NULL,
  `payment_status` enum('paid','partial','pending','overdue','deferred_next_month','unpaid_auto') DEFAULT 'pending' COMMENT 'paid=pagado completo, partial=abono/pago parcial, pending=pendiente, overdue=vencido, deferred_next_month=pasa al siguiente mes, unpaid_auto=no pagado automáticamente al fin de mes',
  `services_status` varchar(50) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `observations` text DEFAULT NULL,
  `payment_registered_by_user_id` int(11) DEFAULT NULL COMMENT 'ID del admin/employee que registró el pago',
  `payment_registered_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha y hora en que se registró el pago',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_invoice_month` (`client_user_id`,`invoice_year`,`invoice_month`),
  KEY `fk_payment_registered_by` (`payment_registered_by_user_id`),
  KEY `idx_invoices_workspace` (`workspace_id`),
  CONSTRAINT `fk_payment_registered_by` FOREIGN KEY (`payment_registered_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `monthly_invoices_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monthly_invoices`
--

LOCK TABLES `monthly_invoices` WRITE;
/*!40000 ALTER TABLE `monthly_invoices` DISABLE KEYS */;
INSERT INTO `monthly_invoices` VALUES
(4,1,3,2025,1,0.00,0.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,'2025-01-31','2025-12-28 07:01:09',NULL,1,'2025-12-28 07:01:44'),
(5,1,4,2025,1,0.00,0.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,'2025-01-31','2025-12-28 07:01:09',NULL,1,'2025-12-28 07:01:44'),
(6,1,5,2025,1,0.00,0.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,'2025-01-31','2025-12-28 07:01:09',NULL,1,'2025-12-28 07:01:44'),
(7,1,6,2025,1,0.00,0.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,'2025-01-31','2025-12-28 07:01:09',NULL,1,'2025-12-28 07:01:45'),
(8,1,3,2025,2,0.00,0.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,'2025-02-28','2025-12-28 07:03:56',NULL,1,'2025-12-28 07:09:10'),
(9,1,4,2025,2,0.00,0.00,0.00,NULL,50.00,0.00,50.00,'pending',NULL,'2025-02-28','2025-12-28 07:03:56',NULL,NULL,NULL),
(10,1,5,2025,2,0.00,0.00,0.00,NULL,50.00,0.00,50.00,'pending',NULL,'2025-02-28','2025-12-28 07:03:56',NULL,NULL,NULL),
(11,1,6,2025,2,0.00,0.00,0.00,NULL,50.00,0.00,50.00,'pending',NULL,'2025-02-28','2025-12-28 07:03:56',NULL,NULL,NULL),
(13,NULL,4,2025,3,0.00,50.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,NULL,'2025-12-28 07:24:44',NULL,NULL,NULL),
(14,NULL,5,2025,3,0.00,50.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,NULL,'2025-12-28 07:24:44',NULL,NULL,NULL),
(15,NULL,6,2025,3,0.00,50.00,0.00,NULL,50.00,50.00,0.00,'paid',NULL,NULL,'2025-12-28 07:24:44',NULL,NULL,NULL);
/*!40000 ALTER TABLE `monthly_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monthly_service_checklist`
--

DROP TABLE IF EXISTS `monthly_service_checklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `monthly_service_checklist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `invoice_id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `status` enum('pending','completed','not_applicable') DEFAULT 'pending',
  `completed_by_user_id` int(11) DEFAULT NULL,
  `completion_date` timestamp NULL DEFAULT NULL,
  `next_payment_date` date DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `omiso_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL COMMENT 'ID del servicio al que pertenece esta tarea',
  `activities_completed` int(11) DEFAULT 0,
  `activities_total` int(11) DEFAULT 0,
  `client_form_completed` tinyint(1) DEFAULT 0,
  `variable_step_index` int(11) DEFAULT 0 COMMENT 'Índice del paso actual en patrón de recurrencia variable',
  `client_approved` tinyint(1) DEFAULT NULL COMMENT 'NULL=pendiente, TRUE=aprobado, FALSE=rechazado',
  `client_approved_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha de aprobación/rechazo',
  `client_rejection_reason` text DEFAULT NULL COMMENT 'Motivo del rechazo',
  `auto_approve_days` int(11) DEFAULT 7 COMMENT 'Días para auto-aprobar después de subir archivos',
  `files_uploaded_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha cuando se subieron los archivos',
  `auto_approved` tinyint(1) DEFAULT 0 COMMENT 'Si fue auto-aprobado por tiempo',
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `completed_by_user_id` (`completed_by_user_id`),
  KEY `fk_checklist_service` (`service_id`),
  KEY `idx_checklist_workspace` (`workspace_id`),
  KEY `idx_checklist_client_approved` (`client_approved`),
  CONSTRAINT `fk_checklist_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `monthly_service_checklist_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `monthly_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `monthly_service_checklist_ibfk_2` FOREIGN KEY (`completed_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monthly_service_checklist`
--

LOCK TABLES `monthly_service_checklist` WRITE;
/*!40000 ALTER TABLE `monthly_service_checklist` DISABLE KEYS */;
INSERT INTO `monthly_service_checklist` VALUES
(4,NULL,13,'Servicio Prueba Auto','pending',NULL,NULL,NULL,NULL,NULL,NULL,8,0,0,0,0,NULL,NULL,NULL,7,NULL,0),
(5,NULL,14,'Servicio Prueba Auto','pending',NULL,NULL,NULL,NULL,NULL,NULL,8,0,0,0,0,NULL,NULL,NULL,7,NULL,0),
(6,NULL,15,'Servicio Prueba Auto','pending',NULL,NULL,NULL,NULL,NULL,NULL,8,0,0,0,0,NULL,NULL,NULL,7,NULL,0);
/*!40000 ALTER TABLE `monthly_service_checklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_history`
--

DROP TABLE IF EXISTS `password_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action` enum('reset_by_admin','reset_by_email','changed_by_user','first_login_change') NOT NULL,
  `performed_by` int(11) DEFAULT NULL COMMENT 'ID del admin que realizó el reset, NULL si fue el propio usuario',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `password_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `password_history_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_history`
--

LOCK TABLES `password_history` WRITE;
/*!40000 ALTER TABLE `password_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `permission_key` varchar(200) NOT NULL COMMENT 'Formato: page_key:action_key (ej: clients:view)',
  `page_id` int(11) NOT NULL,
  `action_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_key` (`permission_key`),
  KEY `action_id` (`action_id`),
  KEY `idx_permission_key` (`permission_key`),
  KEY `idx_page_action` (`page_id`,`action_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`page_id`) REFERENCES `system_pages` (`id`),
  CONSTRAINT `permissions_ibfk_2` FOREIGN KEY (`action_id`) REFERENCES `system_actions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES
(1,'dashboard:view',1,1,'Ver en Dashboard',1,'2025-12-26 18:04:14'),
(2,'dashboard:list',1,2,'Listar en Dashboard',1,'2025-12-26 18:04:14'),
(3,'clients:view',2,1,'Ver en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(4,'clients:list',2,2,'Listar en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(5,'clients:create',2,3,'Crear en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(6,'clients:edit',2,4,'Editar en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(7,'clients:delete',2,5,'Eliminar en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(8,'clients:assign',2,6,'Asignar en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(9,'clients:activate',2,8,'Activar en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(10,'clients:deactivate',2,9,'Desactivar en Gestión de Clientes',1,'2025-12-26 18:04:14'),
(11,'services:view',3,1,'Ver en Administración de Servicios',1,'2025-12-26 18:04:14'),
(12,'services:list',3,2,'Listar en Administración de Servicios',1,'2025-12-26 18:04:14'),
(13,'services:create',3,3,'Crear en Administración de Servicios',1,'2025-12-26 18:04:14'),
(14,'services:edit',3,4,'Editar en Administración de Servicios',1,'2025-12-26 18:04:14'),
(15,'services:delete',3,5,'Eliminar en Administración de Servicios',1,'2025-12-26 18:04:14'),
(16,'tasks:view',4,1,'Ver en Tareas',1,'2025-12-26 18:04:14'),
(17,'tasks:list',4,2,'Listar en Tareas',1,'2025-12-26 18:04:14'),
(18,'tasks:create',4,3,'Crear en Tareas',1,'2025-12-26 18:04:14'),
(19,'tasks:edit',4,4,'Editar en Tareas',1,'2025-12-26 18:04:14'),
(20,'tasks:delete',4,5,'Eliminar en Tareas',1,'2025-12-26 18:04:14'),
(21,'tasks:assign',4,6,'Asignar en Tareas',1,'2025-12-26 18:04:14'),
(22,'tasks:complete',4,7,'Completar en Tareas',1,'2025-12-26 18:04:14'),
(23,'my-clients:view',5,1,'Ver en Mis Clientes',1,'2025-12-26 18:04:14'),
(24,'my-clients:list',5,2,'Listar en Mis Clientes',1,'2025-12-26 18:04:14'),
(25,'invoices:view',6,1,'Ver en Facturas',1,'2025-12-26 18:04:14'),
(26,'invoices:list',6,2,'Listar en Facturas',1,'2025-12-26 18:04:14'),
(27,'invoices:create',6,3,'Crear en Facturas',1,'2025-12-26 18:04:14'),
(28,'invoices:edit',6,4,'Editar en Facturas',1,'2025-12-26 18:04:14'),
(29,'invoices:delete',6,5,'Eliminar en Facturas',1,'2025-12-26 18:04:14'),
(30,'financial:view',7,1,'Ver en Panel Financiero',1,'2025-12-26 18:04:14'),
(31,'financial:list',7,2,'Listar en Panel Financiero',1,'2025-12-26 18:04:14'),
(32,'financial:manage',7,13,'Gestionar en Panel Financiero',1,'2025-12-26 18:04:14'),
(33,'pool:view',8,1,'Ver en Pool de Clientes',1,'2025-12-26 18:04:14'),
(34,'pool:list',8,2,'Listar en Pool de Clientes',1,'2025-12-26 18:04:14'),
(35,'pool:assign',8,6,'Asignar en Pool de Clientes',1,'2025-12-26 18:04:14'),
(36,'pool:manage',8,13,'Gestionar en Pool de Clientes',1,'2025-12-26 18:04:14'),
(37,'payments:view',9,1,'Ver en Pagos',1,'2025-12-26 18:04:14'),
(38,'payments:list',9,2,'Listar en Pagos',1,'2025-12-26 18:04:14'),
(39,'payments:create',9,3,'Crear en Pagos',1,'2025-12-26 18:04:14'),
(40,'payments:edit',9,4,'Editar en Pagos',1,'2025-12-26 18:04:14'),
(41,'payments:delete',9,5,'Eliminar en Pagos',1,'2025-12-26 18:04:14'),
(42,'payments:approve',9,12,'Aprobar en Pagos',1,'2025-12-26 18:04:14'),
(43,'infractions:view',10,1,'Ver en Infracciones',1,'2025-12-26 18:04:14'),
(44,'infractions:list',10,2,'Listar en Infracciones',1,'2025-12-26 18:04:14'),
(45,'infractions:create',10,3,'Crear en Infracciones',1,'2025-12-26 18:04:14'),
(46,'infractions:edit',10,4,'Editar en Infracciones',1,'2025-12-26 18:04:14'),
(47,'infractions:delete',10,5,'Eliminar en Infracciones',1,'2025-12-26 18:04:14'),
(48,'expenses:view',11,1,'Ver en Gastos',1,'2025-12-26 18:04:14'),
(49,'expenses:list',11,2,'Listar en Gastos',1,'2025-12-26 18:04:14'),
(50,'expenses:create',11,3,'Crear en Gastos',1,'2025-12-26 18:04:14'),
(51,'expenses:edit',11,4,'Editar en Gastos',1,'2025-12-26 18:04:14'),
(52,'expenses:delete',11,5,'Eliminar en Gastos',1,'2025-12-26 18:04:14'),
(53,'bundles:view',12,1,'Ver en Paquetes de Servicios',1,'2025-12-26 18:04:14'),
(54,'bundles:list',12,2,'Listar en Paquetes de Servicios',1,'2025-12-26 18:04:14'),
(55,'bundles:create',12,3,'Crear en Paquetes de Servicios',1,'2025-12-26 18:04:14'),
(56,'bundles:edit',12,4,'Editar en Paquetes de Servicios',1,'2025-12-26 18:04:14'),
(57,'bundles:delete',12,5,'Eliminar en Paquetes de Servicios',1,'2025-12-26 18:04:14'),
(58,'users:view',13,1,'Ver en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(59,'users:list',13,2,'Listar en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(60,'users:create',13,3,'Crear en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(61,'users:edit',13,4,'Editar en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(62,'users:delete',13,5,'Eliminar en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(63,'users:activate',13,8,'Activar en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(64,'users:deactivate',13,9,'Desactivar en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(65,'users:manage',13,13,'Gestionar en Gestión de Usuarios',1,'2025-12-26 18:04:14'),
(66,'roles:view',14,1,'Ver en Gestión de Roles',1,'2025-12-26 18:04:14'),
(67,'roles:list',14,2,'Listar en Gestión de Roles',1,'2025-12-26 18:04:14'),
(68,'roles:create',14,3,'Crear en Gestión de Roles',1,'2025-12-26 18:04:14'),
(69,'roles:edit',14,4,'Editar en Gestión de Roles',1,'2025-12-26 18:04:14'),
(70,'roles:delete',14,5,'Eliminar en Gestión de Roles',1,'2025-12-26 18:04:14'),
(71,'roles:manage',14,13,'Gestionar en Gestión de Roles',1,'2025-12-26 18:04:14'),
(72,'audit:view',15,1,'Ver en Auditoría',1,'2025-12-26 18:04:14'),
(73,'audit:list',15,2,'Listar en Auditoría',1,'2025-12-26 18:04:14'),
(74,'reports:view',16,1,'Ver en Reportes',1,'2025-12-26 18:04:14'),
(75,'reports:list',16,2,'Listar en Reportes',1,'2025-12-26 18:04:14'),
(76,'reports:export',16,10,'Exportar en Reportes',1,'2025-12-26 18:04:14'),
(128,'workspaces:view',17,1,'Ver en Gestion de Workspaces',1,'2025-12-26 18:04:17'),
(129,'workspaces:list',17,2,'Listar en Gestion de Workspaces',1,'2025-12-26 18:04:17'),
(130,'workspaces:create',17,3,'Crear en Gestion de Workspaces',1,'2025-12-26 18:04:17'),
(131,'workspaces:edit',17,4,'Editar en Gestion de Workspaces',1,'2025-12-26 18:04:17'),
(132,'workspaces:delete',17,5,'Eliminar en Gestion de Workspaces',1,'2025-12-26 18:04:17'),
(133,'workspaces:assign',17,6,'Asignar en Gestion de Workspaces',1,'2025-12-26 18:04:17'),
(134,'workspaces:manage',17,13,'Gestionar en Gestion de Workspaces',1,'2025-12-26 18:04:17'),
(135,'financial-payments:view',18,1,'Ver en Gestión Financiera - Pagos',1,'2025-12-26 18:04:23'),
(136,'financial-payments:list',18,2,'Listar en Gestión Financiera - Pagos',1,'2025-12-26 18:04:23'),
(137,'financial-payments:create',18,3,'Crear en Gestión Financiera - Pagos',1,'2025-12-26 18:04:23'),
(138,'financial-payments:edit',18,4,'Editar en Gestión Financiera - Pagos',1,'2025-12-26 18:04:23'),
(139,'financial-payments:approve',18,12,'Aprobar en Gestión Financiera - Pagos',1,'2025-12-26 18:04:23'),
(142,'financial-expenses:view',19,1,'Ver en Gestión Financiera - Gastos',1,'2025-12-26 18:04:23'),
(143,'financial-expenses:list',19,2,'Listar en Gestión Financiera - Gastos',1,'2025-12-26 18:04:23'),
(144,'financial-expenses:create',19,3,'Crear en Gestión Financiera - Gastos',1,'2025-12-26 18:04:23'),
(145,'financial-expenses:edit',19,4,'Editar en Gestión Financiera - Gastos',1,'2025-12-26 18:04:23'),
(146,'financial-expenses:delete',19,5,'Eliminar en Gestión Financiera - Gastos',1,'2025-12-26 18:04:23'),
(147,'financial-expenses:activate',19,8,'Activar en Gestión Financiera - Gastos',1,'2025-12-26 18:04:23'),
(148,'financial-expenses:deactivate',19,9,'Desactivar en Gestión Financiera - Gastos',1,'2025-12-26 18:04:23'),
(149,'financial-infractions:view',20,1,'Ver en Gestión Financiera - Infracciones',1,'2025-12-26 18:04:23'),
(150,'financial-infractions:list',20,2,'Listar en Gestión Financiera - Infracciones',1,'2025-12-26 18:04:23'),
(151,'financial-infractions:create',20,3,'Crear en Gestión Financiera - Infracciones',1,'2025-12-26 18:04:23'),
(152,'financial-infractions:edit',20,4,'Editar en Gestión Financiera - Infracciones',1,'2025-12-26 18:04:23'),
(153,'financial-infractions:deactivate',20,9,'Desactivar en Gestión Financiera - Infracciones',1,'2025-12-26 18:04:23'),
(156,'client-fields:view',21,1,'Ver en Campos de Cliente',1,'2025-12-26 18:04:23'),
(157,'client-fields:list',21,2,'Listar en Campos de Cliente',1,'2025-12-26 18:04:23'),
(158,'client-fields:create',21,3,'Crear en Campos de Cliente',1,'2025-12-26 18:04:23'),
(159,'client-fields:edit',21,4,'Editar en Campos de Cliente',1,'2025-12-26 18:04:23'),
(160,'client-fields:delete',21,5,'Eliminar en Campos de Cliente',1,'2025-12-26 18:04:23'),
(163,'invitations:create',22,3,'Crear en Invitaciones',1,'2025-12-26 18:04:23'),
(164,'invitations:delete',22,5,'Eliminar en Invitaciones',1,'2025-12-26 18:04:23'),
(165,'invitations:list',22,2,'Listar en Invitaciones',1,'2025-12-26 18:04:23'),
(166,'invitations:view',22,1,'Ver en Invitaciones',1,'2025-12-26 18:04:23'),
(170,'bulk-assignment:assign',23,6,'Asignar en Asignación Masiva',1,'2025-12-26 18:04:23'),
(171,'bulk-assignment:create',23,3,'Crear en Asignación Masiva',1,'2025-12-26 18:04:23'),
(172,'bulk-assignment:list',23,2,'Listar en Asignación Masiva',1,'2025-12-26 18:04:23'),
(173,'bulk-assignment:view',23,1,'Ver en Asignación Masiva',1,'2025-12-26 18:04:23');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted` tinyint(1) DEFAULT 1 COMMENT 'TRUE=permitir, FALSE=denegar',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL COMMENT 'Usuario que otorgó el permiso',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`,`permission_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_role` (`role_id`),
  KEY `idx_permission` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=276 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES
(1,1,1,1,'2025-12-26 18:04:14',NULL),
(2,1,2,1,'2025-12-26 18:04:14',NULL),
(3,1,3,1,'2025-12-26 18:04:14',NULL),
(4,1,4,1,'2025-12-26 18:04:14',NULL),
(5,1,5,1,'2025-12-26 18:04:14',NULL),
(6,1,6,1,'2025-12-26 18:04:14',NULL),
(7,1,7,1,'2025-12-26 18:04:14',NULL),
(8,1,8,1,'2025-12-26 18:04:14',NULL),
(9,1,9,1,'2025-12-26 18:04:14',NULL),
(10,1,10,1,'2025-12-26 18:04:14',NULL),
(11,1,11,1,'2025-12-26 18:04:14',NULL),
(12,1,12,1,'2025-12-26 18:04:14',NULL),
(13,1,13,1,'2025-12-26 18:04:14',NULL),
(14,1,14,1,'2025-12-26 18:04:14',NULL),
(15,1,15,1,'2025-12-26 18:04:14',NULL),
(16,1,16,1,'2025-12-26 18:04:14',NULL),
(17,1,17,1,'2025-12-26 18:04:14',NULL),
(18,1,18,1,'2025-12-26 18:04:14',NULL),
(19,1,19,1,'2025-12-26 18:04:14',NULL),
(20,1,20,1,'2025-12-26 18:04:14',NULL),
(21,1,21,1,'2025-12-26 18:04:14',NULL),
(22,1,22,1,'2025-12-26 18:04:14',NULL),
(23,1,23,1,'2025-12-26 18:04:14',NULL),
(24,1,24,1,'2025-12-26 18:04:14',NULL),
(25,1,25,1,'2025-12-26 18:04:14',NULL),
(26,1,26,1,'2025-12-26 18:04:14',NULL),
(27,1,27,1,'2025-12-26 18:04:14',NULL),
(28,1,28,1,'2025-12-26 18:04:14',NULL),
(29,1,29,1,'2025-12-26 18:04:14',NULL),
(30,1,30,1,'2025-12-26 18:04:14',NULL),
(31,1,31,1,'2025-12-26 18:04:14',NULL),
(32,1,32,1,'2025-12-26 18:04:14',NULL),
(33,1,33,1,'2025-12-26 18:04:14',NULL),
(34,1,34,1,'2025-12-26 18:04:14',NULL),
(35,1,35,1,'2025-12-26 18:04:14',NULL),
(36,1,36,1,'2025-12-26 18:04:14',NULL),
(37,1,37,1,'2025-12-26 18:04:14',NULL),
(38,1,38,1,'2025-12-26 18:04:14',NULL),
(39,1,39,1,'2025-12-26 18:04:14',NULL),
(40,1,40,1,'2025-12-26 18:04:14',NULL),
(41,1,41,1,'2025-12-26 18:04:14',NULL),
(42,1,42,1,'2025-12-26 18:04:14',NULL),
(43,1,43,1,'2025-12-26 18:04:14',NULL),
(44,1,44,1,'2025-12-26 18:04:14',NULL),
(45,1,45,1,'2025-12-26 18:04:14',NULL),
(46,1,46,1,'2025-12-26 18:04:14',NULL),
(47,1,47,1,'2025-12-26 18:04:14',NULL),
(48,1,48,1,'2025-12-26 18:04:14',NULL),
(49,1,49,1,'2025-12-26 18:04:14',NULL),
(50,1,50,1,'2025-12-26 18:04:14',NULL),
(51,1,51,1,'2025-12-26 18:04:14',NULL),
(52,1,52,1,'2025-12-26 18:04:14',NULL),
(53,1,53,1,'2025-12-26 18:04:14',NULL),
(54,1,54,1,'2025-12-26 18:04:14',NULL),
(55,1,55,1,'2025-12-26 18:04:14',NULL),
(56,1,56,1,'2025-12-26 18:04:14',NULL),
(57,1,57,1,'2025-12-26 18:04:14',NULL),
(58,1,58,1,'2025-12-26 18:04:14',NULL),
(59,1,59,1,'2025-12-26 18:04:14',NULL),
(60,1,60,1,'2025-12-26 18:04:14',NULL),
(61,1,61,1,'2025-12-26 18:04:14',NULL),
(62,1,62,1,'2025-12-26 18:04:14',NULL),
(63,1,63,1,'2025-12-26 18:04:14',NULL),
(64,1,64,1,'2025-12-26 18:04:14',NULL),
(65,1,65,1,'2025-12-26 18:04:14',NULL),
(66,1,66,1,'2025-12-26 18:04:14',NULL),
(67,1,67,1,'2025-12-26 18:04:14',NULL),
(68,1,68,1,'2025-12-26 18:04:14',NULL),
(69,1,69,1,'2025-12-26 18:04:14',NULL),
(70,1,70,1,'2025-12-26 18:04:14',NULL),
(71,1,71,1,'2025-12-26 18:04:14',NULL),
(72,1,72,1,'2025-12-26 18:04:14',NULL),
(73,1,73,1,'2025-12-26 18:04:14',NULL),
(74,1,74,1,'2025-12-26 18:04:14',NULL),
(75,1,75,1,'2025-12-26 18:04:14',NULL),
(76,1,76,1,'2025-12-26 18:04:14',NULL),
(128,2,9,1,'2025-12-26 18:04:14',NULL),
(129,2,8,1,'2025-12-26 18:04:14',NULL),
(130,2,5,1,'2025-12-26 18:04:14',NULL),
(131,2,10,1,'2025-12-26 18:04:14',NULL),
(132,2,7,1,'2025-12-26 18:04:14',NULL),
(133,2,6,1,'2025-12-26 18:04:14',NULL),
(134,2,4,1,'2025-12-26 18:04:14',NULL),
(135,2,3,1,'2025-12-26 18:04:14',NULL),
(136,2,2,1,'2025-12-26 18:04:14',NULL),
(137,2,1,1,'2025-12-26 18:04:14',NULL),
(138,2,27,1,'2025-12-26 18:04:14',NULL),
(139,2,29,1,'2025-12-26 18:04:14',NULL),
(140,2,28,1,'2025-12-26 18:04:14',NULL),
(141,2,26,1,'2025-12-26 18:04:14',NULL),
(142,2,25,1,'2025-12-26 18:04:14',NULL),
(143,2,24,1,'2025-12-26 18:04:14',NULL),
(144,2,23,1,'2025-12-26 18:04:14',NULL),
(145,2,76,1,'2025-12-26 18:04:14',NULL),
(146,2,75,1,'2025-12-26 18:04:14',NULL),
(147,2,74,1,'2025-12-26 18:04:14',NULL),
(148,2,21,1,'2025-12-26 18:04:14',NULL),
(149,2,22,1,'2025-12-26 18:04:14',NULL),
(150,2,18,1,'2025-12-26 18:04:14',NULL),
(151,2,20,1,'2025-12-26 18:04:14',NULL),
(152,2,19,1,'2025-12-26 18:04:14',NULL),
(153,2,17,1,'2025-12-26 18:04:14',NULL),
(154,2,16,1,'2025-12-26 18:04:14',NULL),
(155,2,59,1,'2025-12-26 18:04:14',NULL),
(156,2,58,1,'2025-12-26 18:04:14',NULL),
(159,3,1,1,'2025-12-26 18:04:14',NULL),
(160,3,26,1,'2025-12-26 18:04:14',NULL),
(161,3,25,1,'2025-12-26 18:04:14',NULL),
(162,3,24,1,'2025-12-26 18:04:14',NULL),
(163,3,23,1,'2025-12-26 18:04:14',NULL),
(164,3,22,1,'2025-12-26 18:04:14',NULL),
(165,3,17,1,'2025-12-26 18:04:14',NULL),
(166,3,16,1,'2025-12-26 18:04:14',NULL),
(174,4,1,1,'2025-12-26 18:04:14',NULL),
(175,4,26,1,'2025-12-26 18:04:14',NULL),
(176,4,25,1,'2025-12-26 18:04:14',NULL),
(177,1,133,1,'2025-12-26 18:04:17',NULL),
(178,1,130,1,'2025-12-26 18:04:17',NULL),
(179,1,132,1,'2025-12-26 18:04:17',NULL),
(180,1,131,1,'2025-12-26 18:04:17',NULL),
(181,1,129,1,'2025-12-26 18:04:17',NULL),
(182,1,134,1,'2025-12-26 18:04:17',NULL),
(183,1,128,1,'2025-12-26 18:04:17',NULL),
(184,2,129,1,'2025-12-26 18:04:17',NULL),
(185,2,128,1,'2025-12-26 18:04:17',NULL),
(187,1,170,1,'2025-12-26 18:04:23',NULL),
(188,4,170,1,'2025-12-26 18:04:23',NULL),
(189,3,170,1,'2025-12-26 18:04:23',NULL),
(190,2,170,1,'2025-12-26 18:04:23',NULL),
(191,1,171,1,'2025-12-26 18:04:23',NULL),
(192,4,171,1,'2025-12-26 18:04:23',NULL),
(193,3,171,1,'2025-12-26 18:04:23',NULL),
(194,2,171,1,'2025-12-26 18:04:23',NULL),
(195,1,172,1,'2025-12-26 18:04:23',NULL),
(196,4,172,1,'2025-12-26 18:04:23',NULL),
(197,3,172,1,'2025-12-26 18:04:23',NULL),
(198,2,172,1,'2025-12-26 18:04:23',NULL),
(199,1,173,1,'2025-12-26 18:04:23',NULL),
(200,4,173,1,'2025-12-26 18:04:23',NULL),
(201,3,173,1,'2025-12-26 18:04:23',NULL),
(202,2,173,1,'2025-12-26 18:04:23',NULL),
(203,1,158,1,'2025-12-26 18:04:23',NULL),
(204,4,158,1,'2025-12-26 18:04:23',NULL),
(205,3,158,1,'2025-12-26 18:04:23',NULL),
(206,2,158,1,'2025-12-26 18:04:23',NULL),
(207,1,160,1,'2025-12-26 18:04:23',NULL),
(208,4,160,1,'2025-12-26 18:04:23',NULL),
(209,3,160,1,'2025-12-26 18:04:23',NULL),
(210,2,160,1,'2025-12-26 18:04:23',NULL),
(211,1,159,1,'2025-12-26 18:04:23',NULL),
(212,4,159,1,'2025-12-26 18:04:23',NULL),
(213,3,159,1,'2025-12-26 18:04:23',NULL),
(214,2,159,1,'2025-12-26 18:04:23',NULL),
(215,1,157,1,'2025-12-26 18:04:23',NULL),
(216,4,157,1,'2025-12-26 18:04:23',NULL),
(217,3,157,1,'2025-12-26 18:04:23',NULL),
(218,2,157,1,'2025-12-26 18:04:23',NULL),
(219,1,156,1,'2025-12-26 18:04:23',NULL),
(220,4,156,1,'2025-12-26 18:04:23',NULL),
(221,3,156,1,'2025-12-26 18:04:23',NULL),
(222,2,156,1,'2025-12-26 18:04:23',NULL),
(223,1,147,1,'2025-12-26 18:04:23',NULL),
(224,1,144,1,'2025-12-26 18:04:23',NULL),
(225,1,148,1,'2025-12-26 18:04:23',NULL),
(226,1,146,1,'2025-12-26 18:04:23',NULL),
(227,1,145,1,'2025-12-26 18:04:23',NULL),
(228,1,143,1,'2025-12-26 18:04:23',NULL),
(229,1,142,1,'2025-12-26 18:04:23',NULL),
(230,1,151,1,'2025-12-26 18:04:23',NULL),
(231,1,153,1,'2025-12-26 18:04:23',NULL),
(232,1,152,1,'2025-12-26 18:04:23',NULL),
(233,1,150,1,'2025-12-26 18:04:23',NULL),
(234,1,149,1,'2025-12-26 18:04:23',NULL),
(235,1,139,1,'2025-12-26 18:04:23',NULL),
(236,1,137,1,'2025-12-26 18:04:23',NULL),
(237,1,138,1,'2025-12-26 18:04:23',NULL),
(238,1,136,1,'2025-12-26 18:04:23',NULL),
(239,1,135,1,'2025-12-26 18:04:23',NULL),
(240,1,163,1,'2025-12-26 18:04:23',NULL),
(241,4,163,1,'2025-12-26 18:04:23',NULL),
(242,3,163,1,'2025-12-26 18:04:23',NULL),
(243,2,163,1,'2025-12-26 18:04:23',NULL),
(244,1,164,1,'2025-12-26 18:04:23',NULL),
(245,4,164,1,'2025-12-26 18:04:23',NULL),
(246,3,164,1,'2025-12-26 18:04:23',NULL),
(247,2,164,1,'2025-12-26 18:04:23',NULL),
(248,1,165,1,'2025-12-26 18:04:23',NULL),
(249,4,165,1,'2025-12-26 18:04:23',NULL),
(250,3,165,1,'2025-12-26 18:04:23',NULL),
(251,2,165,1,'2025-12-26 18:04:23',NULL),
(252,1,166,1,'2025-12-26 18:04:23',NULL),
(253,4,166,1,'2025-12-26 18:04:23',NULL),
(254,3,166,1,'2025-12-26 18:04:23',NULL),
(255,2,166,1,'2025-12-26 18:04:23',NULL),
(256,4,133,1,'2025-12-26 18:04:23',NULL),
(257,3,133,1,'2025-12-26 18:04:23',NULL),
(258,2,133,1,'2025-12-26 18:04:23',NULL),
(259,4,130,1,'2025-12-26 18:04:23',NULL),
(260,3,130,1,'2025-12-26 18:04:23',NULL),
(261,2,130,1,'2025-12-26 18:04:23',NULL),
(262,4,132,1,'2025-12-26 18:04:23',NULL),
(263,3,132,1,'2025-12-26 18:04:23',NULL),
(264,2,132,1,'2025-12-26 18:04:23',NULL),
(265,4,131,1,'2025-12-26 18:04:23',NULL),
(266,3,131,1,'2025-12-26 18:04:23',NULL),
(267,2,131,1,'2025-12-26 18:04:23',NULL),
(268,4,129,1,'2025-12-26 18:04:23',NULL),
(269,3,129,1,'2025-12-26 18:04:23',NULL),
(270,4,134,1,'2025-12-26 18:04:23',NULL),
(271,3,134,1,'2025-12-26 18:04:23',NULL),
(272,2,134,1,'2025-12-26 18:04:23',NULL),
(273,4,128,1,'2025-12-26 18:04:23',NULL),
(274,3,128,1,'2025-12-26 18:04:23',NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_key` varchar(100) NOT NULL COMMENT 'Clave única del rol (ej: admin, manager, employee)',
  `role_name` varchar(200) NOT NULL COMMENT 'Nombre legible del rol',
  `description` text DEFAULT NULL,
  `is_system_role` tinyint(1) DEFAULT 0 COMMENT 'TRUE si es un rol del sistema (no se puede eliminar)',
  `is_active` tinyint(1) DEFAULT 1,
  `created_in_workspace_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_key` (`role_key`),
  KEY `idx_role_key` (`role_key`),
  KEY `idx_active` (`is_active`),
  KEY `fk_roles_workspace` (`created_in_workspace_id`),
  CONSTRAINT `fk_roles_workspace` FOREIGN KEY (`created_in_workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'admin','Administrador','Acceso completo al sistema',1,1,NULL,'2025-12-26 18:04:14','2025-12-26 18:04:14'),
(2,'manager','Gerente','Puede gestionar empleados y ver reportes',1,1,NULL,'2025-12-26 18:04:14','2025-12-26 18:04:14'),
(3,'employee','Empleado','Acceso a clientes asignados y tareas',1,1,NULL,'2025-12-26 18:04:14','2025-12-26 18:04:14'),
(4,'client','Cliente','Acceso solo a su información',1,1,NULL,'2025-12-26 18:04:14','2025-12-26 18:04:14');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_activities`
--

DROP TABLE IF EXISTS `service_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `activity_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_required` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_service_activities_order` (`service_id`,`display_order`),
  CONSTRAINT `service_activities_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_activities`
--

LOCK TABLES `service_activities` WRITE;
/*!40000 ALTER TABLE `service_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_bundles`
--

DROP TABLE IF EXISTS `service_bundles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_bundles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `bundle_name` varchar(255) NOT NULL COMMENT 'Nombre del paquete (ej: "Paquete Básico SAT")',
  `description` text DEFAULT NULL COMMENT 'Descripción del paquete',
  `bundle_price` decimal(10,2) NOT NULL COMMENT 'Precio del paquete completo',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Si el paquete está activo y disponible',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `client_description` text DEFAULT NULL COMMENT 'Descripción visible para el cliente',
  `base_price` decimal(10,2) DEFAULT 0.00 COMMENT 'Precio base mensual del bundle (servicios incluidos)',
  `billing_type` enum('fixed','dynamic') DEFAULT 'dynamic' COMMENT 'fixed=siempre igual, dynamic=varía según servicios que tocan',
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_bundles_workspace` (`workspace_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Paquetes/bundles de servicios que se cobran juntos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_bundles`
--

LOCK TABLES `service_bundles` WRITE;
/*!40000 ALTER TABLE `service_bundles` DISABLE KEYS */;
INSERT INTO `service_bundles` VALUES
(1,1,'Paquete Básico SAT','Incluye los 4 servicios principales de SAT',50.00,1,'2025-12-26 18:04:10','2025-12-26 18:04:17',NULL,0.00,'dynamic');
/*!40000 ALTER TABLE `service_bundles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_client_form_fields`
--

DROP TABLE IF EXISTS `service_client_form_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_client_form_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `field_label` varchar(255) NOT NULL,
  `field_type` enum('text','number','date','select','multiselect','file','textarea','email','phone','checkbox') NOT NULL,
  `placeholder` text DEFAULT NULL,
  `default_value` text DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `validation_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`validation_rules`)),
  `select_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`select_options`)),
  `display_order` int(11) DEFAULT 0,
  `help_text` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_service_form_fields` (`service_id`,`display_order`),
  CONSTRAINT `service_client_form_fields_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_client_form_fields`
--

LOCK TABLES `service_client_form_fields` WRITE;
/*!40000 ALTER TABLE `service_client_form_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_client_form_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_operational_costs`
--

DROP TABLE IF EXISTS `service_operational_costs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_operational_costs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `service_id` int(11) NOT NULL COMMENT 'ID del servicio',
  `invoice_id` int(11) DEFAULT NULL COMMENT 'ID de la factura específica (si aplica)',
  `client_user_id` int(11) NOT NULL COMMENT 'ID del cliente',
  `cost_amount` decimal(10,2) NOT NULL COMMENT 'Monto del costo operativo',
  `revenue_amount` decimal(10,2) NOT NULL COMMENT 'Monto cobrado al cliente',
  `profit_amount` decimal(10,2) GENERATED ALWAYS AS (`revenue_amount` - `cost_amount`) STORED COMMENT 'Ganancia = revenue - cost (calculado automáticamente)',
  `description` text DEFAULT NULL COMMENT 'Descripción del servicio específico (ej: "Omiso complejidad alta")',
  `cost_date` date NOT NULL COMMENT 'Fecha del costo',
  `created_by_user_id` int(11) NOT NULL COMMENT 'Admin que registró el costo',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `idx_service` (`service_id`),
  KEY `idx_invoice` (`invoice_id`),
  KEY `idx_client` (`client_user_id`),
  KEY `idx_date` (`cost_date`),
  KEY `idx_soc_workspace` (`workspace_id`),
  CONSTRAINT `service_operational_costs_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_operational_costs_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `monthly_invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `service_operational_costs_ibfk_3` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_operational_costs_ibfk_4` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Costos operativos variables de servicios (ej: cada omiso tiene costo diferente)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_operational_costs`
--

LOCK TABLES `service_operational_costs` WRITE;
/*!40000 ALTER TABLE `service_operational_costs` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_operational_costs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_recurrence_rules`
--

DROP TABLE IF EXISTS `service_recurrence_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_recurrence_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `variable_pattern` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variable_pattern`)),
  `completion_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`completion_days`)),
  `activation_days_before` int(11) DEFAULT 7,
  `day_of_week` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_id` (`service_id`),
  CONSTRAINT `service_recurrence_rules_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_recurrence_rules`
--

LOCK TABLES `service_recurrence_rules` WRITE;
/*!40000 ALTER TABLE `service_recurrence_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_recurrence_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_requests`
--

DROP TABLE IF EXISTS `service_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `service_id` int(11) DEFAULT NULL COMMENT 'Servicio solicitado (puede ser NULL si es descripción libre)',
  `request_description` text DEFAULT NULL COMMENT 'Descripción de lo que necesita',
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `reviewed_by_user_id` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `reviewed_by_user_id` (`reviewed_by_user_id`),
  KEY `idx_service_requests_client` (`client_user_id`),
  KEY `idx_service_requests_status` (`status`),
  CONSTRAINT `service_requests_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_requests_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `service_requests_ibfk_3` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_requests`
--

LOCK TABLES `service_requests` WRITE;
/*!40000 ALTER TABLE `service_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_subscription_requests`
--

DROP TABLE IF EXISTS `service_subscription_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_subscription_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `client_user_id` int(11) NOT NULL,
  `workspace_id` int(11) DEFAULT NULL,
  `request_type` enum('one_time','subscribe') NOT NULL DEFAULT 'one_time',
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `request_notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL,
  `processed_by_user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `processed_by_user_id` (`processed_by_user_id`),
  KEY `idx_client_requests` (`client_user_id`,`status`),
  KEY `idx_pending_requests` (`status`,`requested_at`),
  KEY `idx_workspace_requests` (`workspace_id`,`status`),
  CONSTRAINT `service_subscription_requests_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_subscription_requests_ibfk_2` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_subscription_requests_ibfk_3` FOREIGN KEY (`processed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_subscription_requests`
--

LOCK TABLES `service_subscription_requests` WRITE;
/*!40000 ALTER TABLE `service_subscription_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_subscription_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_upload_slots`
--

DROP TABLE IF EXISTS `service_upload_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_upload_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `slot_name` varchar(100) NOT NULL,
  `slot_label` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_required` tinyint(1) DEFAULT 1,
  `allowed_file_types` varchar(255) DEFAULT '*',
  `max_file_size_mb` int(11) DEFAULT 10,
  `visibility` enum('admin_only','client_only','both') DEFAULT 'both',
  `send_via_whatsapp` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_service_slots_order` (`service_id`,`display_order`),
  CONSTRAINT `service_upload_slots_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_upload_slots`
--

LOCK TABLES `service_upload_slots` WRITE;
/*!40000 ALTER TABLE `service_upload_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_upload_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `service_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `default_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `recurrence_type` enum('monthly','bimonthly','quarterly','annual','custom','one_time') DEFAULT 'monthly' COMMENT 'Tipo de recurrencia del servicio',
  `recurrence_days` int(11) DEFAULT NULL COMMENT 'Número de días para recurrencia custom (ej: 30, 60, 90)',
  `activation_day` int(11) DEFAULT 25 COMMENT 'Día del mes en que se activa la tarea (ej: 25 = última semana)',
  `activation_window_days` int(11) DEFAULT 7 COMMENT 'Días antes del activation_day en que se puede activar (ej: 7 = una semana antes)',
  `requires_file` tinyint(1) DEFAULT 1 COMMENT 'Indica si se debe subir un archivo al completar la tarea',
  `completion_determines_next` tinyint(1) DEFAULT 0 COMMENT 'Si TRUE, el usuario especifica la próxima fecha al completar la tarea (como Libros)',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Indica si el servicio está activo y genera tareas automáticamente',
  `has_operational_cost` tinyint(1) DEFAULT 0 COMMENT 'Si el servicio tiene un costo operativo (ej: libros, omisos)',
  `operational_cost_type` enum('none','fixed','variable') DEFAULT 'none' COMMENT 'none=sin costo, fixed=costo fijo, variable=costo varía por caso',
  `operational_cost_amount` decimal(10,2) DEFAULT NULL COMMENT 'Monto del costo operativo para tipo fixed',
  `is_on_request` tinyint(1) DEFAULT 0 COMMENT 'Indica si el servicio solo se activa por solicitud del cliente',
  `is_global` tinyint(1) DEFAULT 0 COMMENT 'TRUE si el servicio esta disponible en todos los workspaces',
  `operational_cost` decimal(10,2) DEFAULT 0.00,
  `recurrence_type_extended` enum('annual','semiannual','quarterly','bimonthly','monthly','biweekly','weekly','on_demand','variable','one_time') DEFAULT 'monthly',
  `employee_notes` text DEFAULT NULL,
  `client_notes` text DEFAULT NULL,
  `assignment_type` enum('all_clients','selected_clients','on_request') DEFAULT 'selected_clients',
  `file_config` enum('none','optional','required') DEFAULT 'required',
  `visible_to_clients` tinyint(1) DEFAULT 1,
  `allow_subscription` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_is_on_request` (`is_on_request`),
  KEY `idx_services_workspace` (`workspace_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES
(4,NULL,'Facturación','Servicio mensual de facturación electrónica',0.00,'2025-12-27 18:03:34','monthly',NULL,1,7,1,0,1,0,'none',NULL,0,1,0.00,'monthly',NULL,NULL,'all_clients','required',1,0),
(5,NULL,'Verificador Integrado','Verificación integrada de documentos fiscales',0.00,'2025-12-27 18:03:34','monthly',NULL,1,7,1,0,1,0,'none',NULL,0,1,0.00,'monthly',NULL,NULL,'all_clients','required',1,0),
(6,NULL,'Apertura de Libros','Apertura y configuración de libros contables',0.00,'2025-12-27 18:03:34','annual',NULL,1,7,1,0,1,0,'none',NULL,0,1,0.00,'monthly',NULL,NULL,'all_clients','required',1,0),
(7,NULL,'Pago de Libros','Gestión de pago de libros contables',0.00,'2025-12-27 18:03:34','annual',NULL,1,7,1,0,1,0,'none',NULL,0,1,0.00,'monthly',NULL,NULL,'all_clients','required',1,0),
(8,NULL,'Servicio Prueba Auto',NULL,50.00,'2025-12-28 07:24:23','monthly',NULL,25,7,1,0,1,0,'none',NULL,0,0,0.00,'monthly',NULL,NULL,'selected_clients','required',1,0);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(255) DEFAULT NULL,
  `logo_url` varchar(512) DEFAULT NULL,
  `theme_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`theme_json`)),
  `features_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features_json`)),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
(1,'SAT System',NULL,'{\"primary\":\"#2563eb\"}','{\"workspaces\":true}','2025-12-26 18:05:06');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_actions`
--

DROP TABLE IF EXISTS `system_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_key` varchar(100) NOT NULL COMMENT 'Clave única de la acción (ej: view, create, edit, delete)',
  `action_name` varchar(200) NOT NULL COMMENT 'Nombre legible de la acción',
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `action_key` (`action_key`),
  KEY `idx_action_key` (`action_key`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_actions`
--

LOCK TABLES `system_actions` WRITE;
/*!40000 ALTER TABLE `system_actions` DISABLE KEYS */;
INSERT INTO `system_actions` VALUES
(1,'view','Ver','Visualizar información',1,'2025-12-26 18:04:14'),
(2,'list','Listar','Ver listado de registros',1,'2025-12-26 18:04:14'),
(3,'create','Crear','Crear nuevos registros',1,'2025-12-26 18:04:14'),
(4,'edit','Editar','Modificar registros existentes',1,'2025-12-26 18:04:14'),
(5,'delete','Eliminar','Eliminar registros',1,'2025-12-26 18:04:14'),
(6,'assign','Asignar','Asignar recursos a usuarios',1,'2025-12-26 18:04:14'),
(7,'complete','Completar','Marcar como completado',1,'2025-12-26 18:04:14'),
(8,'activate','Activar','Activar registros',1,'2025-12-26 18:04:14'),
(9,'deactivate','Desactivar','Desactivar registros',1,'2025-12-26 18:04:14'),
(10,'export','Exportar','Exportar datos',1,'2025-12-26 18:04:14'),
(11,'import','Importar','Importar datos',1,'2025-12-26 18:04:14'),
(12,'approve','Aprobar','Aprobar solicitudes o cambios',1,'2025-12-26 18:04:14'),
(13,'manage','Gestionar','Gestión completa del módulo',1,'2025-12-26 18:04:14');
/*!40000 ALTER TABLE `system_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_pages`
--

DROP TABLE IF EXISTS `system_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_key` varchar(100) NOT NULL COMMENT 'Clave única de la página (ej: clients, services)',
  `page_name` varchar(200) NOT NULL COMMENT 'Nombre legible de la página',
  `description` text DEFAULT NULL,
  `parent_page_id` int(11) DEFAULT NULL COMMENT 'Para páginas anidadas',
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_key` (`page_key`),
  KEY `parent_page_id` (`parent_page_id`),
  KEY `idx_page_key` (`page_key`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `system_pages_ibfk_1` FOREIGN KEY (`parent_page_id`) REFERENCES `system_pages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_pages`
--

LOCK TABLES `system_pages` WRITE;
/*!40000 ALTER TABLE `system_pages` DISABLE KEYS */;
INSERT INTO `system_pages` VALUES
(1,'dashboard','Dashboard','Panel principal con métricas y resumen general del negocio',NULL,1,1,'2025-12-26 18:04:14'),
(2,'clients','Gestión de Clientes','Administración completa de clientes: crear, editar, ver historial',NULL,2,1,'2025-12-26 18:04:14'),
(3,'services','Servicios','Catálogo de servicios: crear, editar precios, configurar recurrencia',NULL,3,1,'2025-12-26 18:04:14'),
(4,'tasks','Tareas Pendientes','Ver y gestionar tareas asignadas, marcar como completadas',NULL,4,1,'2025-12-26 18:04:14'),
(5,'my-clients','Mis Clientes','Clientes asignados al usuario actual para seguimiento',NULL,5,1,'2025-12-26 18:04:14'),
(6,'invoices','Facturas','Gestión de facturas mensuales',NULL,6,0,'2025-12-26 18:04:14'),
(7,'financial','Gestión Financiera','Acceso general a la página de Gestión Financiera',NULL,7,1,'2025-12-26 18:04:14'),
(8,'pool','Pool de Clientes','Pool compartido de clientes',NULL,8,0,'2025-12-26 18:04:14'),
(9,'payments','Pagos','Registro de pagos de clientes',NULL,9,0,'2025-12-26 18:04:14'),
(10,'infractions','Infracciones','Gestión de infracciones de clientes',NULL,10,0,'2025-12-26 18:04:14'),
(11,'expenses','Gastos','Registro de gastos operativos',NULL,11,0,'2025-12-26 18:04:14'),
(12,'bundles','Bundles','Paquetes de servicios predefinidos para asignar a clientes',NULL,12,1,'2025-12-26 18:04:14'),
(13,'users','Usuarios','Administrar usuarios del sistema: empleados, admins, clientes',NULL,13,1,'2025-12-26 18:04:14'),
(14,'roles','Roles y Permisos','Crear roles y asignar permisos granulares',NULL,14,1,'2025-12-26 18:04:14'),
(15,'audit','Auditoría','Logs de auditoría y actividad',NULL,15,0,'2025-12-26 18:04:14'),
(16,'reports','Reportes','Generación de reportes',NULL,16,0,'2025-12-26 18:04:14'),
(17,'workspaces','Gestion de Workspaces','Administracion de espacios de trabajo separados',NULL,17,1,'2025-12-26 18:04:17'),
(18,'financial-payments','Gestión Financiera - Pagos','Tab de pagos: registrar cobros, ver pagos pendientes, historial',7,71,1,'2025-12-26 18:04:23'),
(19,'financial-expenses','Gestión Financiera - Gastos','Tab de gastos: registrar gastos únicos y recurrentes',7,72,1,'2025-12-26 18:04:23'),
(20,'financial-infractions','Gestión Financiera - Infracciones','Tab de infracciones: crear y resolver infracciones de clientes',7,73,1,'2025-12-26 18:04:23'),
(21,'client-fields','Campos de Cliente','Configurar campos personalizados para perfiles de clientes',NULL,25,1,'2025-12-26 18:04:23'),
(22,'invitations','Invitaciones','Códigos de invitación para registro de nuevos clientes',NULL,26,1,'2025-12-26 18:04:23'),
(23,'bulk-assignment','Asignación Masiva','Asignar tareas a múltiples clientes con filtros avanzados',NULL,27,1,'2025-12-26 18:04:23');
/*!40000 ALTER TABLE `system_pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_activity_progress`
--

DROP TABLE IF EXISTS `task_activity_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_activity_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `status` enum('pending','completed','skipped') DEFAULT 'pending',
  `completed_by_user_id` int(11) DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_task_activity` (`task_id`,`activity_id`),
  KEY `activity_id` (`activity_id`),
  KEY `completed_by_user_id` (`completed_by_user_id`),
  KEY `idx_task_progress` (`task_id`,`status`),
  CONSTRAINT `task_activity_progress_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `monthly_service_checklist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_activity_progress_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `service_activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_activity_progress_ibfk_3` FOREIGN KEY (`completed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_activity_progress`
--

LOCK TABLES `task_activity_progress` WRITE;
/*!40000 ALTER TABLE `task_activity_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_activity_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_client_form_responses`
--

DROP TABLE IF EXISTS `task_client_form_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_client_form_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `field_id` int(11) NOT NULL,
  `response_value` text DEFAULT NULL,
  `file_path` varchar(512) DEFAULT NULL,
  `submitted_by_user_id` int(11) NOT NULL,
  `submitted_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_task_field_response` (`task_id`,`field_id`),
  KEY `field_id` (`field_id`),
  KEY `submitted_by_user_id` (`submitted_by_user_id`),
  KEY `idx_task_responses` (`task_id`),
  CONSTRAINT `task_client_form_responses_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `monthly_service_checklist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_client_form_responses_ibfk_2` FOREIGN KEY (`field_id`) REFERENCES `service_client_form_fields` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_client_form_responses_ibfk_3` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_client_form_responses`
--

LOCK TABLES `task_client_form_responses` WRITE;
/*!40000 ALTER TABLE `task_client_form_responses` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_client_form_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_observations`
--

DROP TABLE IF EXISTS `task_observations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_observations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `workspace_id` int(11) DEFAULT NULL,
  `task_id` int(11) NOT NULL,
  `client_user_id` int(11) NOT NULL,
  `created_by_user_id` int(11) NOT NULL,
  `observation_text` text DEFAULT NULL,
  `rating` tinyint(4) DEFAULT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `idx_client` (`client_user_id`),
  KEY `idx_task` (`task_id`),
  KEY `idx_primary` (`client_user_id`,`is_primary`),
  KEY `idx_observations_workspace` (`workspace_id`),
  CONSTRAINT `task_observations_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `monthly_service_checklist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_observations_ibfk_2` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_observations_ibfk_3` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Observaciones y calificaciones por tarea completada';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_observations`
--

LOCK TABLES `task_observations` WRITE;
/*!40000 ALTER TABLE `task_observations` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_observations` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER before_insert_task_observation
BEFORE INSERT ON task_observations
FOR EACH ROW
BEGIN
  
  IF NEW.is_primary = TRUE THEN
    UPDATE task_observations
    SET is_primary = FALSE
    WHERE client_user_id = NEW.client_user_id
      AND is_primary = TRUE;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER before_update_task_observation
BEFORE UPDATE ON task_observations
FOR EACH ROW
BEGIN
  
  IF NEW.is_primary = TRUE AND OLD.is_primary = FALSE THEN
    UPDATE task_observations
    SET is_primary = FALSE
    WHERE client_user_id = NEW.client_user_id
      AND is_primary = TRUE
      AND id != NEW.id;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `task_uploaded_files`
--

DROP TABLE IF EXISTS `task_uploaded_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_uploaded_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `slot_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(512) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size_bytes` bigint(20) DEFAULT NULL,
  `uploaded_by_user_id` int(11) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `uploaded_by_user_id` (`uploaded_by_user_id`),
  KEY `idx_task_files` (`task_id`),
  KEY `idx_slot_files` (`slot_id`),
  CONSTRAINT `task_uploaded_files_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `monthly_service_checklist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_uploaded_files_ibfk_2` FOREIGN KEY (`slot_id`) REFERENCES `service_upload_slots` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_uploaded_files_ibfk_3` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_uploaded_files`
--

LOCK TABLES `task_uploaded_files` WRITE;
/*!40000 ALTER TABLE `task_uploaded_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_uploaded_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_settings`
--

DROP TABLE IF EXISTS `tenant_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_settings`
--

LOCK TABLES `tenant_settings` WRITE;
/*!40000 ALTER TABLE `tenant_settings` DISABLE KEYS */;
INSERT INTO `tenant_settings` VALUES
(1,'roles_per_workspace','false','boolean','Si true, los roles son específicos por workspace. Si false, son globales.','2025-12-26 18:04:23','2025-12-26 18:04:23'),
(2,'smtp_host','','string','Host del servidor SMTP','2025-12-26 18:04:24','2025-12-26 18:04:24'),
(3,'smtp_port','587','string','Puerto del servidor SMTP','2025-12-26 18:04:24','2025-12-26 18:04:24'),
(4,'smtp_user','','string','Usuario SMTP','2025-12-26 18:04:24','2025-12-26 18:04:24'),
(5,'smtp_password','','string','Contraseña SMTP','2025-12-26 18:04:24','2025-12-26 18:04:24'),
(6,'smtp_from_email','','string','Email del remitente','2025-12-26 18:04:24','2025-12-26 18:04:24'),
(7,'smtp_from_name','','string','Nombre del remitente','2025-12-26 18:04:24','2025-12-26 18:04:24'),
(8,'password_reset_expiry_hours','24','string','Horas de validez del token de reset','2025-12-26 18:04:24','2025-12-26 18:04:24');
/*!40000 ALTER TABLE `tenant_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activity_stats`
--

DROP TABLE IF EXISTS `user_activity_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_activity_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `stat_date` date NOT NULL,
  `tasks_completed` int(11) DEFAULT 0 COMMENT 'Tareas completadas en el día',
  `clients_managed` int(11) DEFAULT 0 COMMENT 'Clientes gestionados',
  `services_completed` int(11) DEFAULT 0 COMMENT 'Servicios completados',
  `login_count` int(11) DEFAULT 0 COMMENT 'Veces que inició sesión',
  `actions_performed` int(11) DEFAULT 0 COMMENT 'Acciones totales realizadas',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`stat_date`),
  KEY `idx_user` (`user_id`),
  KEY `idx_date` (`stat_date`),
  CONSTRAINT `user_activity_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activity_stats`
--

LOCK TABLES `user_activity_stats` WRITE;
/*!40000 ALTER TABLE `user_activity_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_activity_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted` tinyint(1) DEFAULT 1 COMMENT 'TRUE=permitir, FALSE=denegar (sobrescribe rol)',
  `granted_by` int(11) DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `reason` text DEFAULT NULL COMMENT 'Razón de la asignación directa',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_permission` (`user_id`,`permission_id`),
  KEY `granted_by` (`granted_by`),
  KEY `idx_user` (`user_id`),
  KEY `idx_permission` (`permission_id`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `granted_by` int(11) DEFAULT NULL COMMENT 'Usuario que otorgó el rol',
  `granted_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha de expiración del rol (NULL=permanente)',
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL COMMENT 'Notas sobre la asignación',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role` (`user_id`,`role_id`),
  KEY `granted_by` (`granted_by`),
  KEY `idx_user` (`user_id`),
  KEY `idx_role` (`role_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_workspaces`
--

DROP TABLE IF EXISTS `user_workspaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_workspaces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `workspace_id` int(11) NOT NULL,
  `role_in_workspace` enum('owner','admin','member','viewer') DEFAULT 'member',
  `is_primary` tinyint(1) DEFAULT 0 COMMENT 'Workspace principal del usuario',
  `assigned_by_user_id` int(11) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_workspace` (`user_id`,`workspace_id`),
  KEY `idx_user_workspaces_user` (`user_id`),
  KEY `idx_user_workspaces_workspace` (`workspace_id`),
  CONSTRAINT `user_workspaces_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_workspaces_ibfk_2` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1050 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_workspaces`
--

LOCK TABLES `user_workspaces` WRITE;
/*!40000 ALTER TABLE `user_workspaces` DISABLE KEYS */;
INSERT INTO `user_workspaces` VALUES
(1,1,1,'owner',1,NULL,'2025-12-26 18:08:30'),
(2,3,3,'viewer',0,NULL,'2025-12-26 21:48:52'),
(3,4,3,'viewer',0,NULL,'2025-12-26 21:48:52'),
(4,5,3,'viewer',0,NULL,'2025-12-26 21:48:52'),
(5,6,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(6,7,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(7,8,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(8,9,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(9,10,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(10,11,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(11,12,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(12,13,3,'viewer',0,NULL,'2025-12-26 21:48:53'),
(13,14,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(14,15,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(15,16,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(16,17,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(17,18,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(18,19,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(19,20,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(20,21,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(21,22,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(22,23,3,'viewer',0,NULL,'2025-12-26 21:48:54'),
(23,24,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(24,25,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(25,26,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(26,27,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(27,28,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(28,29,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(29,30,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(30,31,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(31,32,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(32,33,3,'viewer',0,NULL,'2025-12-26 21:48:55'),
(33,34,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(34,35,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(35,36,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(36,37,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(37,38,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(38,39,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(39,40,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(40,41,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(41,42,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(42,43,3,'viewer',0,NULL,'2025-12-26 21:48:56'),
(43,44,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(44,45,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(45,46,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(46,47,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(47,48,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(48,49,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(49,50,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(50,51,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(51,52,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(52,53,3,'viewer',0,NULL,'2025-12-26 21:48:57'),
(53,54,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(54,55,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(55,56,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(56,57,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(57,58,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(58,59,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(59,60,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(60,61,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(61,62,3,'viewer',0,NULL,'2025-12-26 21:48:58'),
(62,63,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(63,64,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(64,65,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(65,66,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(66,67,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(67,68,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(68,69,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(69,70,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(70,71,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(71,72,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(72,73,3,'viewer',0,NULL,'2025-12-26 21:48:59'),
(73,74,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(74,75,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(75,76,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(76,77,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(77,78,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(78,79,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(79,80,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(80,81,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(81,82,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(82,83,3,'viewer',0,NULL,'2025-12-26 21:49:00'),
(83,84,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(84,85,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(85,86,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(86,87,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(87,88,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(88,89,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(89,90,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(90,91,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(91,92,3,'viewer',0,NULL,'2025-12-26 21:49:01'),
(92,93,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(93,94,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(95,96,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(96,97,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(97,98,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(98,99,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(99,100,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(101,102,3,'viewer',0,NULL,'2025-12-26 21:49:02'),
(102,103,3,'viewer',0,NULL,'2025-12-26 21:49:03'),
(105,106,3,'viewer',0,NULL,'2025-12-26 21:49:03'),
(107,108,3,'viewer',0,NULL,'2025-12-26 21:49:03'),
(108,109,3,'viewer',0,NULL,'2025-12-26 21:49:03'),
(110,111,3,'viewer',0,NULL,'2025-12-26 21:49:03'),
(111,112,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(112,113,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(113,114,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(114,115,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(115,116,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(116,117,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(117,118,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(118,119,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(119,120,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(120,121,3,'viewer',0,NULL,'2025-12-26 21:49:04'),
(121,122,3,'viewer',0,NULL,'2025-12-26 21:49:05'),
(125,126,3,'viewer',0,NULL,'2025-12-26 21:49:05'),
(131,132,3,'viewer',0,NULL,'2025-12-26 21:49:06'),
(132,133,3,'viewer',0,NULL,'2025-12-26 21:49:06'),
(136,137,3,'viewer',0,NULL,'2025-12-26 21:49:06'),
(142,143,3,'viewer',0,NULL,'2025-12-26 21:49:07'),
(146,147,3,'viewer',0,NULL,'2025-12-26 21:49:07'),
(147,148,3,'viewer',0,NULL,'2025-12-26 21:49:07'),
(148,149,3,'viewer',0,NULL,'2025-12-26 21:49:07'),
(149,150,3,'viewer',0,NULL,'2025-12-26 21:49:07'),
(150,151,3,'viewer',0,NULL,'2025-12-26 21:49:07'),
(151,152,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(152,153,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(153,154,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(154,155,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(155,156,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(156,157,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(157,158,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(158,159,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(159,160,3,'viewer',0,NULL,'2025-12-26 21:49:08'),
(160,161,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(161,162,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(162,163,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(163,164,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(164,165,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(165,166,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(166,167,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(167,168,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(168,169,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(169,170,3,'viewer',0,NULL,'2025-12-26 21:49:09'),
(170,171,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(171,172,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(173,174,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(174,175,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(175,176,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(176,177,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(177,178,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(178,179,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(179,180,3,'viewer',0,NULL,'2025-12-26 21:49:10'),
(180,181,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(181,182,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(182,183,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(183,184,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(184,185,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(185,186,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(186,187,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(187,188,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(188,189,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(189,190,3,'viewer',0,NULL,'2025-12-26 21:49:11'),
(190,191,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(191,192,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(192,193,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(193,194,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(194,195,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(195,196,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(196,197,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(197,198,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(198,199,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(199,200,3,'viewer',0,NULL,'2025-12-26 21:49:12'),
(200,201,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(201,202,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(202,203,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(203,204,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(204,205,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(205,206,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(206,207,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(207,208,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(208,209,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(209,210,3,'viewer',0,NULL,'2025-12-26 21:49:13'),
(210,211,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(211,212,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(212,213,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(213,214,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(214,215,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(215,216,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(216,217,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(217,218,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(218,219,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(219,220,3,'viewer',0,NULL,'2025-12-26 21:49:14'),
(220,221,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(221,222,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(222,223,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(223,224,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(224,225,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(225,226,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(226,227,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(227,228,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(228,229,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(229,230,3,'viewer',0,NULL,'2025-12-26 21:49:15'),
(230,231,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(231,232,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(232,233,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(233,234,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(234,235,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(235,236,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(236,237,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(237,238,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(238,239,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(239,240,3,'viewer',0,NULL,'2025-12-26 21:49:16'),
(240,241,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(241,242,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(242,243,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(243,244,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(244,245,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(245,246,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(246,247,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(247,248,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(248,249,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(249,250,3,'viewer',0,NULL,'2025-12-26 21:49:17'),
(250,251,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(251,252,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(252,253,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(253,254,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(254,255,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(255,256,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(256,257,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(257,258,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(258,259,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(259,260,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(260,261,3,'viewer',0,NULL,'2025-12-26 21:49:18'),
(261,262,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(262,263,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(263,264,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(264,265,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(265,266,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(266,267,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(267,268,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(268,269,3,'viewer',0,NULL,'2025-12-26 21:49:19'),
(269,270,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(270,271,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(271,272,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(272,273,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(273,274,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(274,275,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(275,276,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(276,277,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(277,278,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(278,279,3,'viewer',0,NULL,'2025-12-26 21:49:20'),
(279,280,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(280,281,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(281,282,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(282,283,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(283,284,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(284,285,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(285,286,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(286,287,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(287,288,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(288,289,3,'viewer',0,NULL,'2025-12-26 21:49:21'),
(289,290,3,'viewer',0,NULL,'2025-12-26 21:49:22'),
(290,291,3,'viewer',0,NULL,'2025-12-26 21:49:22'),
(292,292,3,'viewer',0,NULL,'2025-12-26 21:49:22'),
(296,296,3,'viewer',0,NULL,'2025-12-26 21:49:22'),
(297,297,3,'viewer',0,NULL,'2025-12-26 21:49:22'),
(298,298,3,'viewer',0,NULL,'2025-12-26 21:49:23'),
(299,299,3,'viewer',0,NULL,'2025-12-26 21:49:23'),
(300,300,3,'viewer',0,NULL,'2025-12-26 21:49:23'),
(301,301,3,'viewer',0,NULL,'2025-12-26 21:49:23'),
(302,302,3,'viewer',0,NULL,'2025-12-26 21:49:23'),
(312,312,3,'viewer',0,NULL,'2025-12-26 21:49:24'),
(313,313,3,'viewer',0,NULL,'2025-12-26 21:49:24'),
(315,315,3,'viewer',0,NULL,'2025-12-26 21:49:24'),
(316,316,3,'viewer',0,NULL,'2025-12-26 21:49:24'),
(317,317,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(319,319,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(320,320,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(321,321,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(322,322,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(323,323,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(324,324,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(325,325,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(326,326,3,'viewer',0,NULL,'2025-12-26 21:49:25'),
(327,327,3,'viewer',0,NULL,'2025-12-26 21:49:26'),
(328,328,3,'viewer',0,NULL,'2025-12-26 21:49:26'),
(329,329,3,'viewer',0,NULL,'2025-12-26 21:49:26'),
(333,333,3,'viewer',0,NULL,'2025-12-26 21:49:26'),
(334,334,3,'viewer',0,NULL,'2025-12-26 21:49:26'),
(335,335,3,'viewer',0,NULL,'2025-12-26 21:49:26'),
(336,336,3,'viewer',0,NULL,'2025-12-26 21:49:26'),
(337,337,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(338,338,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(339,339,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(340,340,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(341,341,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(342,342,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(343,343,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(344,344,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(345,345,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(346,346,3,'viewer',0,NULL,'2025-12-26 21:49:27'),
(347,1,3,'owner',0,NULL,'2025-12-26 21:50:00'),
(1042,1,4,'owner',0,1,'2025-12-27 04:21:09');
/*!40000 ALTER TABLE `user_workspaces` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('client','admin','employee','superadmin') NOT NULL,
  `nit` varchar(50) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `deactivation_reason` text DEFAULT NULL COMMENT 'Motivo por el cual el cliente fue desactivado (ej: impago, fraude, etc.)',
  `deactivated_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha y hora en que el cliente fue desactivado',
  `deactivated_by_user_id` int(11) DEFAULT NULL COMMENT 'ID del admin/employee que desactivó al cliente',
  `services_disabled_by_infractions` tinyint(1) DEFAULT 0 COMMENT 'TRUE si los servicios fueron deshabilitados por 3+ infracciones',
  `registered_via_invitation_id` int(11) DEFAULT NULL,
  `registration_ip` varchar(45) DEFAULT NULL,
  `must_change_password` tinyint(1) DEFAULT 0,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_assigned_to` (`assigned_to_user_id`),
  KEY `fk_user_deactivated_by` (`deactivated_by_user_id`),
  KEY `idx_users_is_active` (`is_active`),
  KEY `idx_users_active_role` (`is_active`,`role`),
  KEY `fk_user_invitation` (`registered_via_invitation_id`),
  KEY `idx_users_reset_token` (`password_reset_token`),
  CONSTRAINT `fk_user_deactivated_by` FOREIGN KEY (`deactivated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_invitation` FOREIGN KEY (`registered_via_invitation_id`) REFERENCES `invitation_codes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_assigned_to` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=356 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin@acme.com','$2a$10$1JEdEpCywzhbuTKFCiD9aeDDRgfKvCGzeq2UkzQFm8D8Rl5Da78we','Administrador Principal','admin',NULL,NULL,NULL,1,'2025-12-26 18:05:06',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL),
(3,'tottifer2000@gmail.com','$2a$10$y0JuSYK7n6apzxdPHDdkKujjgTR8vF0uxQ6cfhG096BWxU/UGW4ia','Otto Rene Maradiaga Ramos','client','104206187',NULL,'5569-4236',1,'2025-12-26 21:48:52',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(4,'indiacono02@gmail.com','$2a$10$EGJsZtBWxRPy0T/m9j044OU3uN8Lr6ZEucW2jEM2aTR0oodZklb46','Jefrey Samuel Sanchez Ramos','client','108668940',NULL,'5705-1003',1,'2025-12-26 21:48:52',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(5,'solareasa971@gmail.com','$2a$10$A2xLcxtBWQtMFVhN4c/vFe5qfpxyBudaZc3qI/kS4CulbDAtE/T4K','Carlos Alfonso Cabrera Alfaro','client','51749092',NULL,'4723-6512',1,'2025-12-26 21:48:52',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(6,'batresdenilson164@gmail.com','$2a$10$00K6z1S3EqVw.H.lNLhbiOktGdGlbI9aIrHYuSD2.jv7NRE0JN6xy','Denilson Ottoniel Batres Hernandez','client','110687493',NULL,'4256-2712  4008-1283',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(7,'albertodepaz01@gmail.com','$2a$10$2/bURjknc93JpiC2icNtDuo8K6VZbB6AEiTuawJGvbWbq1exltOQO','JUAN ALBERTO, DE PAZ NICOLÁS','client','106251325',NULL,'5484-2627',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(8,'sancheztobar.v05@gmail.com','$2a$10$QiIWRW8EZld6QKf6axFzL.oM2hEdl.xBLgBYPXrkk6a1lc55tIwrS','Victor Francisco Sanchez Tobar','client','78573777',NULL,'4124-2554',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(9,'alejandra258marroquin@gmail.com','$2a$10$1It/E/cMsUgP2BsecNbBbeP4fYy5oXU/PT2thfWX6QXGDZGeFsZQ2','Maria Alejandra Marroquin Orellana','client','105089486',NULL,'3399-4000',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(10,'mirandamynor777@gmail.com','$2a$10$6.bKum8YDuJZCpWWoAZssOY3.nvhq87X9naX/Xzf.8Z5Dp8qgaMDS','Mynor Miranda Mendez','client','91932998',NULL,'3255-4886',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(11,'lg849886@gmail.com','$2a$10$pSX1VJYqNUHWGXC/5s7.Auii40.HGRkZmcdpqdFEAZhUh4yoFbKSW','Lucas Fernando Garcia Perez','client','106145568',NULL,'4071-6032',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(12,'jametoziel@gmail.com','$2a$10$hm.xjrP/vfAlDmVjeCadweJWKnZaAm7WSJ5fZMh9aDBpToBpcYcye','Jonatan Rolando Lopez Temaj','client','107452995',NULL,'5204-9635',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(13,'egudiel513@gmail.com','$2a$10$LXXJHwrDIkuOHrO67BR0y.44QZIhjujPYEkNBLb5F8yPln4ABrnrS','Ever Yahir Alexis Gudiel Castillo','client','119088592',NULL,'5567-1479',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(14,'cristopherjimenez7655@gmail.com','$2a$10$BOyinQ/2J2rv9SKHBPtIj.KFF.HkdrJqW7KoSXKmE3R77j8onbbZ.','Cristopher Oswaldo Jimenez Pineda','client','114134278',NULL,'3847-5603',1,'2025-12-26 21:48:53',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(15,'angelaguilar140405@gmail.com','$2a$10$PoysTWsF8jGnTdHvIcziEumqJEI2ornBBnWeziZnqcQvqakqJ2LBO','Angel David Hernandez Aguilar','client','119252384',NULL,'5694-2513',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(16,'omarquinonez988@gmail.com','$2a$10$1TrN99IkGGlOTnC7rrul7eCsvmb.HQZ91GZaVhtU.1y/6/AxHBlCG','Rudiman Omar Quiñonez Hernandez','client','73811319',NULL,'5870-1656',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(17,'popmaurilio28@gmail.com','$2a$10$rjP6Z4c5ofJTiZfwTN.PmukMBMYSESMO/g2RRIPQEJ9fruALe/nGO','Maurilio Pop Xe','client','85018023',NULL,'5356-5742',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(18,'osbinvell@gmail.com','$2a$10$UKj1Z.HeLp33uvGnqQIZqOamTwYbxugwh4jbOgV7WBrgC1B6eXFXu','Osbin Audiel Veliz Ramirez','client','95444785',NULL,'5597-8686',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(19,'rogeliorm2000@gmail.com','$2a$10$2ox97PSPuormGhlPZXPWK.vBzkHin/e00sAGyJ75Ci5WSGBnD74/O','Rogelio Raquel Melgar','client','102486972',NULL,'3647-4040',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(20,'freiserenriquesotomonterroso@gmail.com','$2a$10$1tntPf3c1ihx6Af30cZSYuFYCemP.rz9YW7Ps.VTR9SUGx5bCcxjS','Freiser Enrique Soto Monterroso','client','117186074',NULL,'5133-4314',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(21,'miguelperez310208@gmail.com','$2a$10$NOgZxBRutxvQKh1dDQ.wIeqo4W/S1SaP0dF/lL4i3I.tz/oD5Yuqm','Elfido Miguel Perez Ramirez','client','115220313',NULL,'4882-3679',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(22,'gerberperez3338@gmail.com','$2a$10$zG/6hvEJKBWRc5WDrz6vHOUlLHjHGg4FU.daYaDYACXWYa9BS.9Ku','Gerber Estuardo Perez Velasquez','client','118054406',NULL,'4699-6483',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(23,'ramirezmaynor893@gmail.com','$2a$10$sG9emjC3zBNFr.3yZ0b8IeOo.JzWzyd2JykeTFRJhJHKKuM4vdrVe','Mynor Anibal Ramirez Herrera','client','94819246',NULL,'3388-4681',1,'2025-12-26 21:48:54',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(24,'alexreina884@gmail.com','$2a$10$f3Ri7gnlrIMoMtM/CEx5keKbcuRcMkmnO5QWedROQE4DJ0U5I96Fa','Walter Alexis Reina Rivera','client','84580941',NULL,'3158-9395',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(25,'retanajhonatan5@gmail.com','$2a$10$eQckVcg2YHtQYVOcuBQ3rOTuPQiRGwibZ4eH64lkpm6qLUMO4jbOm','Jhonatan Guillermo Retana Cardona','client','108286428',NULL,'3825-1704',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(26,'marvinsalanic431@gmail.com','$2a$10$1WQ4H.O10vsAYFJ9K.eTP.hjbQRR.Fp51Lg3ch2vVdkXGeyY8hJdy','Marvin Orlando Salanic Gomez','client','119076276',NULL,'3621 2034',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(27,'qrene1530@gmail.com','$2a$10$WLyhNJAeCpNYlJN2yt3BnOQ1NtqcKnuCJ3P6m24uE5mQUYLpxsMeK','Edwin René Quiñonez Ramoz','client','100741444',NULL,'3606-2765 3596-3556',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(28,'velasquezabner620@gmail.com','$2a$10$Jq/lptREW9u7ywvNICFb9u23ZYaxKnKdnAd6TXW5mNNMoyQz.CLOy','Abner Alexis Velasquez Latin','client','114800189',NULL,'3825-7890',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(29,'franklitomaas@gmail.com','$2a$10$LJXRW1aeayA17L1J8FiIt.DRlOD9nUDI1E1/xPxXic8WxGA1V.IjO','Franklin Mayck Tomás Agustín','client','116804866',NULL,'4636-1594',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(30,'fredytc124@gmail.com','$2a$10$bE6HyICYpEpEEu27BYPpqOLk2UYc91A.nDqMB29Ov6awfE2mcpi9K','Fredy Ovando Tomás Cardona','client','112526829',NULL,'5195-0679',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(31,'sanchez998carlos@gmail.com','$2a$10$86.7upPS0SmAyhAWS3Ci4.mh2BFP215xjJC8ex0YoDKdpVojl2IJ6','Carlos Humberto Sanchez Vargas','client','101066279',NULL,'3637-7417',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(32,'fernandoloez523@gmail.com','$2a$10$PO3AD.2j/W02CfuwKzVvLuoY.CRT.8q8w6vWD7OYqvum6Z1XM1Evi','Luis Fernando Lopez Peña','client','85310743',NULL,'5699-5587',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(33,'jesushurtado271999@gmail.com','$2a$10$x483K50uATWT8agogcZBV.sK9XdScAJUUBLU8zBGEZ3df.ahKpaH2','Elvidio de Jesus Hurtado Asencio','client','99426536',NULL,'3720-6525',1,'2025-12-26 21:48:55',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(34,'jimenezelman8@gmail.com','$2a$10$09uCzc89O2caNfoRy.aAJ.K21kXiMzaWxznVbXQ1RBc4vZbuiKNO6','Elman Ivan Gonzalez Jimenez','client','95979743',NULL,'51166933',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(35,'augustocesarlopezmunoz60@gmail.com','$2a$10$Ob9p4qYca/n1B00IakJbpeOBe/INC7gy1tX/caua8saTUPCMo9Qb2','Augusto Cesar Lopez Muñoz','client','111533066',NULL,'3602-0633',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(36,'axelrenearias1999@gmail.com','$2a$10$P.gjk/uXclyQvZyf68MphuZRbTfYWepmwpzH/ND33kLrHUWrAHl3O','Axel Rene Perez Arias','client','10410595k',NULL,'4498-3421',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(37,'velasquezvini12@gmail.com','$2a$10$XlpPHrSXUsywNkNg3z8CpeXMKDr36hienhWyNScxaa7vJNoAveh9O','Vinicio Efrain Velasquez Coronado','client','115078878',NULL,'4616-2026',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(38,'adolfoisidro55@gmail.com','$2a$10$plS3fYxjxp7UAa9b848oFOnjquVWdgZRedeKnPR6Ms9zr4Co63/jS','Adolfo Angel Isidro Baltazar','client','119099322',NULL,'4020-6225',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(39,'ronaldcardona096@gmail.com','$2a$10$zyUnZpUYAq9jv6IAJWZCwuLDNsNAAVYKMqvHpXgUKnBfX1B05Rblq','Ronald Geremias Cardona Coronado','client','109064038',NULL,'5578-5854',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(40,'juakaguilon@gmail.com','$2a$10$bbtONmRSk8JY6Juk9zvk5uaPf7EK.sfhKKDb1pdLuQX2j1mTfZw4O','Juan Orlando Aguilón Perez','client','84171111',NULL,'3541-3889',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(41,'eddy787b@gmail.com','$2a$10$PzBwCzzEUXwX7fPLRLbqHea7x7EF5hKmqVTOdJbNdNocYKoNXa1gq','Eddy Rafael Gonzalez Alfaro','client','90172108',NULL,'3589-3079',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(42,'jhcalidad10@gmail.com','$2a$10$/44DCruj7DWa2k4Iqx7PxOOPy/Q5yLFqXNt3uS0g0oMOHi8maqDla','Carlos Alberto Hernandez Lopez','client','76540464',NULL,'5874-4968',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(43,'willyramirez649@gmail.com','$2a$10$Y6iJnFb5pHZticIf3ebCHu0R3VH5tIHX199Sdiu0oVclEpFimAwi6','Willian Estuardo Ramírez Santos','client','65877780',NULL,'4175-5486',1,'2025-12-26 21:48:56',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(44,'wilsonacardonal@gmial.com','$2a$10$wqPr0kJ2MPD/jFHuPtIQrOrzreW5VtFm2TKQr1gcK9O9TKWZGW4Vm','Wilson Adan Cardona Lopez','client','108769011',NULL,'3963-2005',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(45,'ag7921871@gmail.com','$2a$10$jUBgNkNMprUOgesyn9oD9umY2dezNwV8WXBOIYuyploGR/na9.GoW','Anibal Nicolas Garcia Pineda','client','107695006',NULL,'5112-3170',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(46,'alma15franco@gmail.com','$2a$10$ovukZKpXk2aOPB0EAn5/m.E9KDt4hDGNGwE3GsYXFcmnqS0WpNqT2','Alma Yaneth Franco Herrera','client','95288724',NULL,'4693-1714',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(47,'lopeziraeta94@gmail.com','$2a$10$bvEJnDc1MLFvrdmH5wJSO..GHot52j5QcaNRmr.DndfFviSphymqO','Gerber Ottoniel López','client','80211828',NULL,'4935-0665',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(48,'antsha95@gmail.com','$2a$10$StXfdwPCynQZST4Zk9nOuO.Kzr4sfYBzT/qZcx4lljHHnzjvOmwFu','Anthony Isael Linares Linares','client','88501981',NULL,'3881-9041',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(49,'josevasquez37@gmail.com','$2a$10$HFX11YJQJm4NqIa7V.GNo.LvZutUTgot/VAiYGtxIQlmBIRIH4EZe','José Ronaldo Florian Vasquez','client','98733362',NULL,'5490-2851',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(50,'cris130019661@gmail.com','$2a$10$ey0THzXDAhsRKNLMC7A93OXHTfsREMT2TiGMVFhpCBwt.KQJZ6nXy','Cristian Xavier Garcia Esquivel','client','68253842',NULL,'4274-0990',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(51,'jersonalexander700@gmail.com','$2a$10$jSFwGfmjbuRJMNFH8FsKMeA1Na7avwCrpMbTS7COFKYRs.PXDns2y','Jerson Alexander Villanueva Corado','client','48952788',NULL,'5903-9718',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(52,'carlosavh-@hotmail.com','$2a$10$IF4i0r6SKz1Q6j/aP4E2ie1tP.U1uz8MndlhVSE1ceXCkyiiZ.z6y','Carlos Alberto Valdez Herrera','client','82675309',NULL,'4240-4615',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(53,'edwinarguetasat2021@gmail.com','$2a$10$HFk/H2zkMXttsSZSaw2LsO0/WvzXySfztj0SOutrF8d3igkbP1D9.','Edwin Humberto Marroquin Argueta','client','107414716',NULL,'5368-5966',1,'2025-12-26 21:48:57',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(54,'velamaynor@gmail.com','$2a$10$kKSRqLLRlCjNyW7sERUSFuguho9VvcLnLDsWcvFH62OYZNWpJM4.O','Mynor Manuel Vela Ortiz','client','96268719',NULL,'5057 6877',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(55,'juanantoniodonisalfaro@outlook.com','$2a$10$pmbVKoyBtj7.YpgLERN6junVJ3jR/yf6vSrGcrnzQZNd./iJdBQUy','Juan Antonio Donis Alfaro','client','72173076',NULL,'4155-3173',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(56,'jesfriomarlopezjimenez@gmail.com','$2a$10$WDkm9TQBqn.LBMGPvUNPOu.hwi5loSdfkwxBivEAjfbiO.r0YGVDi','Jesfri Omar López Jiménez','client','109581989',NULL,'3748-3485',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(57,'bastiruano7@gmail.com','$2a$10$S8InwRGUQUwdk5rhkL05H.UvQjZcHJfY2XbS8W/iqaphu/VvJtPvK','Vasty Madai Ruano Pernillo','client','109338111',NULL,'4750-9255',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(58,'nancyroxana@gmail.com','$2a$10$aDmDdbX0rBGTdIgXAnt.YOv9zPtydCwX9KDIoZ4l09ONbDkha0XoW','Nancy Roxana Navarro Vasquez','client','68797095',NULL,'4066-9538',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(59,'irismadaimarroquin@gmail.com','$2a$10$ycwLCzgNg/ffw2glzJ1x/O/UGe8r8CKZ5yUzDglaR6HErywJm.U/S','Iris Madai Marroquin Orozco','client','99465574',NULL,'4599-9364',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(60,'esaulgarcia536@gmail.com','$2a$10$yFV8ROYFHuIasxQUTSB56.aTnN.VCtlK2wOIeTcUi1PxLEP/Qqo6e','Edilson Esaul Garcia Granados','client','119271109',NULL,'5369-2516',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(61,'godoydalila937@gmail.com','$2a$10$pztayBpo3BHmEXvhsNP2dObokykUCXWMGtDEWLInf8hrBoSg1Mitm','Katerin Dalila Garza Godoy','client','116080914',NULL,'4674-5040',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(62,'fl6161893@gmail.com','$2a$10$ap28g3iSd35hoCA8EcE3wOgZJ7pupaWhBrMBBe61X2oTR5.cIs7Lm','Fernando López Coronado','client','55812805',NULL,'4680-8161',1,'2025-12-26 21:48:58',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(63,'gjvarezalfaro@gmail.com','$2a$10$S21zGKTIE3nVFbuMjPRkdOCLh8yNQ8GZTwH3hj6mW5qHk5ZwS4RlK','Gustavo Adolfo Juárez Alfaro','client','104049421',NULL,'3795-5360',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(64,'sandylazaro7@gmail.com','$2a$10$HQYx3br03j/6oTsfbSw72OEnJ/vSDcCVEJUlJfUT6O6Tq8xmVMryy','Sandra Angélica Ponciano Lázaro','client','56716117',NULL,'4272-5065',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(65,'wiliamgarza10@yahoo.com','$2a$10$ow8WmERrtqqiSn9sRC42cedUgN6aWDr.rcfiS8Z45mL6mA3OmI47S','William Armando Garza Flores','client','107413906',NULL,'4186-3321',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(66,'guadalupelopez132802@gmail.com','$2a$10$pWL7bVnappcpc6PH07qnoOKszKsA6B/zgwBgq4oyNPK3yhBvsLCqC','Lusbin Guadalupe López Alvarez','client','114200661',NULL,'5326-3568',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(67,'galiciagomezn@gmail.com','$2a$10$VY7SCt6ffLucMzup4kKdO.Ek7HacgXpm3onNYg9WbG.Z8yvozhnu6','Nelson Geovanny Galicia Gomez','client','119164256',NULL,'4953-8179',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(68,'everjoseperezperez2112@gmail.com','$2a$10$O4/1KhfMh4gfXxuWU9aUq.4RMnMaYjexc/zQx7JBlpCXY2MpiJLLG','Eber José Pérez Pérez','client','110861752',NULL,'5373-2087',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(69,'marroquinmarroquinjasmin@gmail.com','$2a$10$KrK2VhjYz1wyhwUwdAAwO.b83tHOMqZGp74ToZYOirz5a3iO1YP5K','Jasmine Saraí Peralta Marroquín','client','108322122',NULL,'4188-0987',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(70,'luisangelaguirrepalma@gmail.com','$2a$10$ZkIvJmPrprr/qE7gIT412eqX4KR.xkYyS9Eg0QdAmf9iECqhR8Msu','Luis Angel Aguirre Palma','client','113317875',NULL,'5384-6645',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(71,'greliaviche88@gmail.com','$2a$10$guDocebRRX.8zlq1/3qOAue8I/NAob0ZkieFifP6MukkrzPc2U0A.','Grely Aneth Aviche Carias','client','63584964',NULL,'3613-9826',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(72,'juancagrijalbelloso@gmail.com','$2a$10$zPnwcGFVuVUC8p75N6giEeS6AcwXNKrcogmbkJrW1yIWx9cvHhNmS','Juan Carlos Grijalva Belloso','client','114807728',NULL,'3577-8820',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(73,'tzunuxhernandezjosedaniel@gmail.com','$2a$10$rYWLJ2Awj4fAj9xf25PDdezCKRRZsczhPVm/iKcuzcR5obrtfMSTu','Jose Daniel Tzunux Hernandez','client','107377241',NULL,'5543-1357',1,'2025-12-26 21:48:59',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(74,'yesicafabiolarodr407@gmail.com','$2a$10$3Ncr/wFTEw7SJZ.Te3fUiOYgiKoSYg/W1CPvkfCAnkHEzyNkhuyRG','Yesica Fabiola Rodriguez Orozco','client','110286383',NULL,'5066 9645',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(75,'crtz2014@gmail.com','$2a$10$8EvKDtNl0gV7UIPywFJzhuG0dwtZAtAkfCQS/NWIX3dfcqLKAlCLK','Alex Adonis Cortez Velasquez','client','54303095',NULL,'3136-9180',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(76,'hallista02@gmail.com','$2a$10$ROXuJyyoax9OyGatUg5XpOmTofleYL4NxbAAq.xS.A9OL4Qcpomea','César Obdulio Rabanales Fuentes','client','109878043',NULL,'4757 3826',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(77,'drch1031@gmail.com','$2a$10$DKY3EZgFOI.aVnO8OvZ4Fua6fKDjM88DJdl9HZBgIG87Dx.gM/8e.','Darwin Ronaél Chávez Peña','client','99687607',NULL,'5832 2058',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(78,'abayron319@gmail.com','$2a$10$UYBkou1hQdrYiavekMFbRuJPzT59mZFNChZ5Trr0PBG7cwOWEHryG','Domingo Bayron Alvarez Hernadez','client','89800788',NULL,'4011 5109',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(79,'ivanalexanderpinedacarias@gmail.com','$2a$10$sch39GpCWmr75s.CkGLDU.21sSpPB3lYQu.tIn.3atW499nxHyxJa','Ivan Alexander Pineda Carías','client','35651563',NULL,'4734-4446',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(80,'germanrevolorio60@gmail.com','$2a$10$GeiAzmdIc6tTYIOWASAwd.VMPInCfx0sO483MGApbie4NP79CM1ZK','German Oswaldo Revolorio Latín','client','117112046',NULL,'4687-6848',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(81,'hipolito01029@gmail.com','$2a$10$C4MpPHAJ4I6OI4lV.XP5yejNcmfgQZ6jhCNkPPOZ6Wu8kWH.lSYjK','Cristian Alexander Hipólito Rodriguez','client','76983072',NULL,'4522-2627',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(82,'danisbarrientos2014@gmail.com','$2a$10$l38VuKUzf.pAtVgBzasU8uxjqNgRNuWIFqPJu4k6yKOhxrwXbbAgK','Danis Estid Barrientos Corado','client','71374620',NULL,'4076-2926',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(83,'pedroaranamartinez@gmail.com','$2a$10$TIHFiqmuXJ6bhCYwXMPqIOR4ngjewLeqYzBtweXQU0ro2IMaEk.q6','Pedro Alberto Arana Martínez','client','109355814',NULL,'46630110',1,'2025-12-26 21:49:00',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(84,'darwinchinchilla500@gmail.com','$2a$10$GmcZ3r3L/FnGfWWFz.jaiuu6ghHpKTI7xE.wNQaneMSRCKcYavD7.','Darwin Omar Chinchilla Corado','client','115347674',NULL,'3184-7239',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(85,'chelitaramos20232023@gmail.com','$2a$10$EkDTXwAwHDPl5ke060YbVeKbxp67ozYz0bVx7d5y4PD0X.Sqx3lRG','Aracely Ramos Godoy','client','119299097',NULL,'3118-6240',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(86,'yeymycolindres120@gmail.com','$2a$10$SqIPiWSy/IhPpb..t148eOQEFx9KC.EUHmrxHylbTG3n/dfOUyw52','Yeymy Elizabeth Peñate Colindres','client','106506447',NULL,'4638-0561',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(87,'la36187680@gmail.com','$2a$10$2VKblsPfESu.wtmitaLPzOO0SyEPr1tnKGfWiGtB0DVyFYJAUoSci','Luis Fernando Agustin Diego','client','108337170',NULL,'3778-7290',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(88,'ecutzal007@gmail.com','$2a$10$qZJRF9LienvcyR3FKwwmkuW6z0fFzuqFE.FLzwoY2qV5lpzATahKK','Eddy Obdulio Cutzal García','client','109308336',NULL,'4167-0160',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(89,'mg4289150@gmail.com','$2a$10$nsyu6ZbXE/CeFsAG9Jlfp.IqTNib8UbBXTStX1mNTNqbYPT7v5GD6','Helen Marisol Canahuí García','client','113017138',NULL,'4170-9333',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(90,'beverlycal1998@gmail.com','$2a$10$D40LoWbuVTtGzg1sRnHgiO9873RWeIjsb4WiBqF4.0UXfWa.Ok582','Liliana Beberly Cal Xaná','client','99388715',NULL,'3951-3836',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(91,'cottojud20@gmail.com','$2a$10$M0rtQG40TXSIocSLIcOCI.emXeScvKflJfu.4o72Zae5zxeoq20Du','Marcela Judith Cotto Sanchez','client','114535868',NULL,'3216-8482',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(92,'estefanymelisacorado@gmail.com','$2a$10$/tSyRPODWVILtrkB375Ylez4rcbUsE/H87wYxiHUBNjj4VafBjJhu','Estefany Melisa Corado Garza','client','118412345',NULL,'4989-4476',1,'2025-12-26 21:49:01',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(93,'barriosaxel202@gmail.com','$2a$10$8kVTr4Gc8hQs0CN5rBKdWOas9Q0imPUgVg5hNvKvMeeMHzvAKc7t6','Axel Eberto Barrios López','client','111666538',NULL,'3293 1814',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(94,'cazunmaria424@gmail.com','$2a$10$YigRXl51Gju3ZtmvhNjLXuzvgBxmJOb0Lp6ep0lDlvbsLid3yZjPu','Maria Concepcion Cazun Zepeda','client','106568043',NULL,'3179 7908',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(96,'jenderly14herrarte@gmail.com','$2a$10$QNzkZOhjrahmTfPL6VRpMuNbDvloAyly0j1PseRbdGGsvF8F3Z7YK','Jenderly Andrea Ramirez Herrarte','client','119158671',NULL,'4262 0198',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(97,'jcoradoycorado@gmail.com','$2a$10$yVPo60AGzMdFr4ujHd/xKOKaVR4FbHB84HTxeVNfqg0tPHMRllAyK','José David Corado y Corado','client','97798770',NULL,'5564 9867',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(98,'depazbreder@gmail.com','$2a$10$EGfyprtN0GfKPcuGfxDXH.Od.cmkhFp0PIHJ1M52hA4tB2RqPZVp.','Breder Alexander De Paz Santos','client','103073809',NULL,'4153-9193',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(99,'andybailon.2023@gmail.com','$2a$10$R51kNhhlA00ev6tKXEjtZeEXPHmkeQ1Gl8uRIb8FKPtuJYIsuhuiy','Andy Adalberto Bailon Hernandez','client','100296106',NULL,'5427-2580',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(100,'luisdiegofuentescruz@gmail.com','$2a$10$xuZvh.MqU.nUfljpbpbvqeQvArhEmYRGaVauUuZbFkcEBmC9ksVrq','Luis Diego Fuentes Cruz','client','116312718',NULL,'47465707',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(102,'perezvictorovidio21@gmail.com','$2a$10$3RKNhDWvqU2JkCRIFPSwgOi3raLxt0Q3YICazoTOw4yFqBnGexNly','Victor Ovidio Perez Arriaza','client','111106311',NULL,'5066 7118',1,'2025-12-26 21:49:02',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(103,'walterocg7@gmail.com','$2a$10$v.Vzffi7CVb3gmRN3LEEB.mF/rTReAx6TXVuDwbcAO1J5AMrSo7Se','Walter Oswaldo CAZUN Godo','client','35596759',NULL,'4641-8675',1,'2025-12-26 21:49:03',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(106,'PENDIENTE','$2a$10$r36wdinODZjCYGCNsDYv.OWXaiR.xBNXxQogYjxiXk747LAjVz9qW','Edgar Zaqueo Ichich Choc','client','80039642',NULL,NULL,1,'2025-12-26 21:49:03',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(108,'jefry3012@gmail.com','$2a$10$4mehLLGXHAm27qL.Gy6A4uMM7nu0MEQV9LPcQPT0NkD7MUp3pbjJ.','Jefrey Eduardo Sical','client','94666466',NULL,'32566673',1,'2025-12-26 21:49:03',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(109,'davidtash95@gmail.com','$2a$10$bdlajBjLTDCqCzasJvhS..lME8M7PrUaVAhJkq6KNpRlzc5bsNPg2','Herbert David Tash Escobar','client','85533181',NULL,'5431 5773',1,'2025-12-26 21:49:03',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(111,'remyangelarturomayorgaperez@gmail.com','$2a$10$gYc33Klph6zafFB30ST8Te54HWFHXj091YgKwYrGHB7jMLFk494Ny','Remy Angel Arturo Mayorga Pérez','client','119626802',NULL,'3594 0504',1,'2025-12-26 21:49:03',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(112,'medary.esquivel25@gmail.com','$2a$10$C2V3pBqnwk/dgZ5DD1QwiuwIdUoKX8fPYoeR0bpYNLaT.qNGIQJJm','Medary Esquivel Ramirez','client','99798107',NULL,'5326 1560',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(113,'riverabeverly799@gmail.com','$2a$10$nyxU1eUKK7jsPwPPWzFPUOgA463tUVUpYcPXIEDGQOKp2bjK7d7Lu','Beverlin Graciela Rivera Vásquez','client','100331807',NULL,'5497 7333',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(114,'vinirivera40@gmail.com','$2a$10$b.WZ3krHlLQfMDAhmfVCkOs.S.5JvainSrERKDMNWVIcDVOHz0VGS','Edwin Vinicio Rivera Esquivel','client','29264871',NULL,'4805 7166',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(115,'castillogodoymarioalejandro@gmail.com','$2a$10$jXTl.mkSpyXldIcIFcU94ePlrAr6TPj50Uvq3lLdXM3iYq4Y/Ze/i','Mario Alejandro Castillo Godoy','client','105091499',NULL,'4009 3489',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(116,'donis22celeste@gmail.com','$2a$10$xHhUtS18W7f.ABlJP4UNGOu788u2PX8mJ37y/h8loZCBLXoVPl35G','Maria Celeste Donis Alfaro','client','82771626',NULL,'5578 4641',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(117,'pablogricelda82@gmail.com','$2a$10$NZqnMUkrzwWZQu/gdSlY1OYrr.Be9bIwK57WI.Wkwx9F6XS3S50QS','Gricelda Micaela Pablo Tomás','client','105380369',NULL,'3235 9804',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(118,'sergioestuardo1997@gmail.com','$2a$10$7PSX8ZhuzG2995DniBiVyusLT8gTLWXqXS5.8vA68.dFLq/6wNiau','Sergio Estuardo Ordoñez Ortega','client','92228747',NULL,'3144 8745',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(119,'manolodominguez1998@gmail.com','$2a$10$4N6.oRsSX8XoY7FqsG8zQ.kKEYvb54Go6H7Q4TwgE.Yfd6wTZ8FVS','Manolo Exzequiel Vasquez Dominguez','client','106418025',NULL,'3600 2042',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(120,'amaliodominguezgaitan@gmail.com','$2a$10$W8GdhIwhStx1qffoDNt.1e0R599M1yPYN8Ni7un6ff5Esr5ww75Tu','Amalio Rodrigo Dominguez Gaitán','client','76785734',NULL,'3097 2268',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(121,'francismelgar229@gmail.com','$2a$10$ztrwhcQJGxbfOdGuu/owAecc/kOZMYF7gxU.jO6aOOpZRnmLKaiiC','Gloria Francis Amabel Martinez Melgar','client','74104683',NULL,'3734 8885',1,'2025-12-26 21:49:04',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(122,'riveravasquezanderyoel@gmail.com','$2a$10$c9Sv5elYbeVilsOFC449OukssQ9JRtq9HnLKsfwqvvXOfFXp97AvS','Ander Yoel Rivera Vasquez','client','99770059',NULL,'3156 3395',1,'2025-12-26 21:49:05',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(126,'eiyelinaceve@gmail.com','$2a$10$.2HExzDdRwULHPcsucornukogaCycOWZzec.I1DxvTjuSLuxoP3WC','Ericka Mercedes Alejandra Acevédo Recinos','client','99381028',NULL,NULL,1,'2025-12-26 21:49:05',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(132,'cristianvidalmaquin@gmail.com','$2a$10$RhNNncUww/pfXw6qKhIFBOB0ZAOzkNqZbgAfLS5/Z4aKR4FQ8nWmC','Cristian Vidal Maquin Cacao','client','119295849',NULL,NULL,1,'2025-12-26 21:49:06',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(133,'vomer9466@gmail.com','$2a$10$k0ZFqAt84OEbrcGs5qdOCuy4kVCc0iOPGcH2UZ8QqwEtgjv60KNie','Omer Naias Vásquez Domínguez','client','117130222',NULL,NULL,1,'2025-12-26 21:49:06',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(137,'johamadaielizabethporojofuentes_946@provial.import','$2a$10$2XkSodYY0.LUrHAta37zNeLEekCN1.N0U3KDeQ14lQBEQCFNQyAxa','Joha Madai Elizabeth Porojo Fuentes','client','104902175',NULL,NULL,1,'2025-12-26 21:49:06',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(143,'gilmamazariegosarana@gmail.com','$2a$10$FFaf/213Wv/vEjHsw0N85egdUmHz1POctNBO8JGR95CDbi8kcRxgO','Gilma Yolanda Mazariegos Arana','client','99742055',NULL,NULL,1,'2025-12-26 21:49:07',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(147,'intecrudiperez@gmail.com','$2a$10$cQsqTCZXI8NV8wDtQaa0xew6bhOuPSw82wwZIvRTGXHH8q9.UHnYO','Rudy Osmin Perez Osorio','client','89507142',NULL,NULL,1,'2025-12-26 21:49:07',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(148,'castillohayderson@gmail.com','$2a$10$KFPuJkXuCDxXqoYAWcP5deLOGZzRrTPEeTkvfRQi83PKqn8ySyKTm','Ahiderson Andre Hernandez Castillo','client','104972696',NULL,NULL,1,'2025-12-26 21:49:07',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(149,'kimylopez11@gmail.com','$2a$10$D25X0BNToKgX5D8CIzwNkOkWGfR3.Q7nvvklKjvavtklIJtinYDBO','Kimberly Alejandra Jorge Lopez','client','101551037',NULL,NULL,1,'2025-12-26 21:49:07',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(150,'donyc7261@gmail.com','$2a$10$LhP6fsStbj3JhH.9aRMyeuLLSLmsBYvGyLrJ8FfvvB1.ycJ2igwnS','Dony Isidro Castillo Herrera','client','112743692',NULL,NULL,1,'2025-12-26 21:49:07',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(151,'cariasmario801@gmail.com','$2a$10$46zrNkSaREMC7eiVdNmT7OpKvzGbQcJ7Wg/Yi8MX3gRQHmrSjDyFS','Mario Llivinson Carías Castro','client','119023326',NULL,NULL,1,'2025-12-26 21:49:07',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(152,'garrido10500@gmail.com','$2a$10$xV5blQjPW7pWf5M.LCAfWeo20yDuC75DAnka4FML1PFX69NgwsFJa','Evelyn Noheli Garrido Trabanino de Torres','client','97351059',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(153,'wg702246@gmail.com','$2a$10$JTYM6fVgNFdJTFbGLk5CKeWP9UC0US.r9v88s9CMNLMa4LWBrsu5G','Walter Garcia Garcia','client','10342220k',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(154,'ascaal1506@hotmail.com','$2a$10$vkf2HAT.sz1MTghef0Sv2.SCG6gxgW3I74S8gumZxiArAiuTHLys2','Astrid Melissa Caal España','client','99483920',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(155,'gervin439@gmail.com','$2a$10$YahoIGcGejRlFOIGewwje.F14WzdYOwVb700zeznogGKqU861TSbe','Gervin Friceli Morales Galvez','client','96081538',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(156,'ronallpz61@gmail.com','$2a$10$CLtvPL3qIV8uHxT4/E3j3u.PxcJQCuCZDzhZlzyJUC0ZObuxd276C','Yulian Ronaldo Santos Lopez','client','113738471',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(157,'monzonramos12@gmail.com','$2a$10$vE91DgHCN0iEozzKavXhGOJN.uHz6AeH7zGx7/B3k24Sz2XitKBR.','Cristofer Ricardo Monzon Ramos','client','113337930',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(158,'sandro1997@outlook.es','$2a$10$m3udtQCmQaORKWtmuTimie7X3k6m4uaNjkGCV0O6lTZYM9/cyULLK','Sandro Emmanuel Ramirez Guerrero','client','110072855',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(159,'pjarevalo18@gmail.com','$2a$10$MxwIKERxbTGocTLsfDncH.XnXG3Nu4ezZgfieE.f0unoA4znZltBe','Paula Jimena Arevalo Florian','client','113531443',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(160,'delonalexin@gmail.com,  ADAVID1997LOPEZ@GMAIL.COM','$2a$10$FSLcHXPBUxalrYcqqpuro.RvfLjQScBofY7iQtoXpG6EFnBVJPvS2','Alexander David de León López','client','105093688',NULL,NULL,1,'2025-12-26 21:49:08',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(161,'wilmeralvizures2016@gmail.com','$2a$10$.eaMmM3zIK1QXEs.2APY4uwze.3XD9YXUgaQM8yNKt2mWPGMZm1fe','Wilmer Abel Alvizures Ramirez','client','103072764',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(162,'iraelramirez68@gmail.com','$2a$10$bHE0.dANWmW8TvcPQ4.e9ObJoVi.eZ3W6ub7tp/asx8XQzXKo5NzS','Franklin Irael Ramírez Pineda','client','103272402',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(163,'abnerreyes012@gmail.com','$2a$10$/REL1Ol9ftm9auDemJWwoOE9hqP197U4t1Pnr5s39oSO55y00UObu','Abner Antonio Reyes Ortiz','client','103886494',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(164,'mariamachan201@gmail.com','$2a$10$TefFrbtO/ZOY1ImeeAg1EuUdsK1yRtxTQDnuu1I184jrkx5nJKsTi','Maria Yesenia Osorio Machan','client','101870655',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(165,'arturo.salazr19@gmail.com','$2a$10$BIjrFMgavw2vaWA7/YhADuxW79ru/12pHtfm6G/rd41bBKIpmr95i','Walter Arturo Salazar Ortiz','client','106592270',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(166,'josuecruz080@gmail.com','$2a$10$Htsqiomak4BmJOdt6MPqBuz7Gyq7U.XJnwLdqZuz5XRwQZWF6/KWm','Alberto Josue Cruz Sarceño','client','114108226',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(167,'santosbeltetonseleniyoliza@gmail.com','$2a$10$GtT1YmnerEed8PalKDV/seljizfimiqCkhnWCJNXpQVwvJLRtEZI.','Seleni Yoliza Santos Belteton','client','111496691',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(168,'keirymireyacoronadoalvarez@gmail.com','$2a$10$dn0AV0mfPtm7n8NJ6wBnyORfdDAhiOc4hUmvx/wjengNuzAHmSdS6','Keiry Mireya Coronado Alvarez','client','89319559',NULL,NULL,1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(169,'abaclindsay@gamil.com','$2a$10$Ho/d2tBsHKnyAt.1xsf/1elFqxh/ecriHkGxCp3ANS3uZ8mfz02iC','Abac Cuyuch Lindsay Alexandra','client','309858909',NULL,'32756760',1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(170,'hilberthsantiagoajiatazlopez@gmail.com','$2a$10$aqdptBjU./wY5l//dVcN2O7Ua7FFtDqz/J7CoTD10UwMAxTYNwAse','Ajiataz López Hilberth Santiago','client','324073461',NULL,'55744603',1,'2025-12-26 21:49:09',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(171,'alonzogaby299@gmail.com','$2a$10$EALF4D.9SpSrsU4O8UHDo.EUjv.8DxyENicY.78zjwxdlQRFS3uJu','Alonzo Farfan Roselin Gabriela','client','113232713',NULL,'42671529',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(172,'edinsonarana@gmail.com','$2a$10$HMVCGPa04LyIFbPRM1CeQ.ufpBQ2zG47.h0AsfNj6dAKVPB5Iokk6','Arana Alveño Edinson Roberto','client','100162622',NULL,'42138828',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(174,'alanarias2301@gmail.com','$2a$10$tOy8HENwIz0aXYG9K5nvj.hz/hVlm8FZoxspXKmbrD4OUvDDR96ce','Arias Alfaro Alan Steve','client','86984411',NULL,'47840490',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(175,'ariasgarciaelmer@gmail.com','$2a$10$tCbredXIlsjsGolY7EeCNOrbCI9apgkIj1uC0R3zk6ufuxkjKNy02','Arias Garcia Elmer','client','109985214',NULL,'45001850',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(176,'ariaskey97@gmail.com','$2a$10$hKWEJO.yA8GYSKQrRL0/OubvUbNMNHuBb9TZ4Drezk.C/ss3l3JKG','Arias López Keyri Margarita','client','112825680',NULL,'40630465',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(177,'Kelviyobanyarias@gmail.com','$2a$10$BTfxI531OVd/j.QfdIjhtOGBf0uu3Gw6vv3mpuYj.bcougSqL1VE.','Arias Villalobos Kelvin Yobany','client','105215066',NULL,'45269859',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(178,'asencio2000jose@gmail.com','$2a$10$DOJEyG0UccD.RdVYSjSHnOT7y1gN1JIGmmdGuzzeA.QqbmBo/Mpl6','Asencio Ortega José Miguel','client','106975579',NULL,'54579752',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(179,'marioernestobolvito@gmail.com','$2a$10$R7PvSmBvhATHt1bzkH6ypeREHhw2oSKhDUqg878Ugar6b2tsuvFWy','Bolvito García Mario Ernesto','client','280490550',NULL,'42856024',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(180,'milvianineth77@gmail.com','$2a$10$IcmaUKhdcDM2BEUkRW2Nt.7s3.hxwyh1mpuxGMVDPJ81yjiWW5xxu','Boteo Cermeño Milvia Nineth','client','57540233',NULL,'42669022',1,'2025-12-26 21:49:10',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(181,'davicarlosalejandro@gmail.com','$2a$10$M8wOm69Kip4GfJW6LC9ndOd/zD58IEzMHXUhrUte8xglVgJNJr0gK','Cabrera Dávila Carlos Alejandro Noé','client','110383753',NULL,'39599186',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(182,'edgarmoran59@gmail.com','$2a$10$wE.utIOzNrKlYR/y.Ito7.rzQPdHe.beUAvkaeVZ2raqRJ6wdtTzW','Cal Morán Edgar Fernando','client','86214284',NULL,'40954775',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(183,'cardonagarciaoscarobdulio@gmail.com','$2a$10$zqWl0f4tbnZuHm1640I4rOspDE8bJEuVNQyYj83ucX3bPPYkXSYMa','Yo ya estaba inscrito como pequeño contribuyente','client','76854728',NULL,'38411748',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(184,'cesarcarias713@gmail.com','$2a$10$uRe0UMzzypj9nIV9HHJpJ.njVVBzgugcVO6LduoNUOL2IHojrIoau','Carias Rodríguez Cesar de Jesús','client','115631925',NULL,'55747056',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(185,'carrerac983@gmail.com','$2a$10$C2U527p3qd2WLw67szLbYuFVLNvzHsJ3urb0ChCezMuyqZZaHyAs.','Carrera Torres Carlos Alberto','client','86599372',NULL,'38180818',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(186,'joselyncastilloi2023@gmail.com','$2a$10$Jh7IuFTgqkgZDucx2VhiM.TfMRkh4hi3E9L8zYJd8Ko1Ma8vSrzdq','Castillo Corleto de Linares Joselyn Merlina','client','104879912',NULL,'57184256',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(187,'memecazunrodriguez77@gmail.com','$2a$10$k0gc3gtfoyl3btGoICh9wOzQIK6Xdj3JecZzsx2Y8pLexuscpb9Y2','Cazùn Rodríguez Manuel Humberto','client','106591037',NULL,'40813032',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(188,'jeremiascetino20@gmail.com','$2a$10$tqKHBR4YRn8H202q.mfR5.84LbOzVni0Njz/dpCPcgDFkejJNVKVi','Cetino Casimiro Jeremias','client','109530306',NULL,'42693607',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(189,'victorichich46@gmail.com','$2a$10$tHwQnwIpzgVuXBivuIfsR.CnaXSe/AjeJ.Yvy03612JCPVoXnrXp2','Chú Ichich Víctor Manuel','client','96016299',NULL,'46604035',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(190,'fernandoretana.com@gmail.com','$2a$10$RnSfG82aAH9RBYCf3.V3rOb97gN1MgHNoBpa6oSOaN50HsnXIgvoq','Corado Retana Luis Fernando','client','274694328',NULL,'51907035',1,'2025-12-26 21:49:11',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(191,'josecordova00610@gmail.com','$2a$10$qUssFA/POYOjGRGM3kodIubX8Dy3Cjxzte5rzN/iQtjkm8fXrk5WS','Córdova Divas José Manuel','client','309386144',NULL,'4280 3126',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(192,'nelsonrivaldocoronado@gmail.com','$2a$10$V3tbkAVemazeSVIjtGxNuuTaTxPCT.M8Mftr8gtPlW7KYtjXDH.Ou','Coronado Pérez Nelson Rivaldo','client','333841417',NULL,'57842020',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(193,'manuelcotto888@gmail.com','$2a$10$r1DUSz2x6mkqO8GvVoc9tOr3HDFX/10edoBUNGnFP6Jg4TrokjoPK','Cotto Trejo Manuel Darío','client','251035921',NULL,'44910406   50091139',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(194,'Josebcotzajay98@gmail.com','$2a$10$K9g2GACwTCvSWfO47S/YzeQsp.7Bd.dSF8SALTQcPPQiZM3m/s67G','Yo ya facturaba antes en la Municipalidad.','client','10446870k',NULL,'54766487',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(195,'damarisrosalindacruzrodriguez@gmail.com','$2a$10$TC2mxVjnXcjh2X/YMzm5fOCOnqsELDnhwHQtPFwf7j3wIo0pN52m.','Cruz Rodríguez Damaris Rosalinda','client','342900293',NULL,'31200263',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(196,'cuyuchsandraelizabeth@gmail.com','$2a$10$5aaR34JV21sK0BR1dHd7yOlpb6/EBuZ/LTLAYN0R/yjA5tyN3YX8y','Cuyuch Polanco Sandra Lisseth','client','92147712',NULL,'44336034',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(197,'juanmanueldela5@gmail.com','$2a$10$woEN.GHtK5Aj2rOLWN0FfeXTuT9XDX3t27m4bmlJralDEsYTcv8ja','De la Rosa Gómez Juan Manuel','client','75987023',NULL,'54857974',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(198,'deleonsonia512@gmail.com','$2a$10$Y/ZNOb6Y2wqHU6CNS9FPa.hBYp4UaY9WF37jYA9a4L.51jI8NbpFy','De León García Sonia Elizabeth','client','116292180',NULL,'44837345',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(199,'elfegoesteban@gmail.com','$2a$10$rer/4GZJUd9SAl5wPDBpVOFNHLdWVyl3BEuoq838Fh1.2FWh5VF5u','Divas Esteban Elfego Esaú','client','113322836',NULL,'54980513',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(200,'kevindivas409@gmail.com','$2a$10$QiHqYRI8Qf754MCjcpJNVOfv9J/a/el5M/RuyjlcoumNb/ebCtPNm','Divas Flores Kevin Alexander','client','116323116',NULL,'58279773',1,'2025-12-26 21:49:12',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(201,'escobarignaciorene@gmail.com','$2a$10$QY.gjp35Q06t9TunwtyPs.i0l/Le1/fwYuh.1YNZkh4wZcDX9Ul8e','Contribuyente del régimen general','client','90454510',NULL,'39953131',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(202,'isaacainimatuj@gmail.com','$2a$10$rNQr5VmX1xnY.FGT4Irji.usEKIhRKEi5m00pTTPRyfSczOMzIIoO','Escobar Nimatuj Esdras Isaac','client','288318021',NULL,'57335979',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(203,'escobedoorantescristian@gmail.com','$2a$10$dezesYQIAa88lBCYitTXWeBSAmyZkCmfvfOMLe6/hkkyLpuhOf7Q6','Escobedo Orantes Cristian Juan Alberto','client','109526368',NULL,'41990514',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(204,'obedesteban101@gmail.com','$2a$10$UIV5ji25PCi6QobNRulPLu6NH2wtYa/U5Cu/.xHN6TX5RrmIoLNry','Esteban Estrada Yonathan Obed','client','112987923',NULL,'47098303',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(205,'felmerfelix2@gmail.com','$2a$10$Rd9n30hr7z73/OKGK6M.lO.Yb8KSOI8xprFPS8OdH6w1W5o/xmc/S','Felix Baltazar Elmer Marino','client','82046360',NULL,'59236079',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(206,'ingridfelix885@gmail.com','$2a$10$3x9AcdTJjmUjNekYR13lxOUNEwml1RMw1y6NX01ZbdZLXawVphJOW','Félix Coronado Ingrid Elizabeth','client','113544634',NULL,'3148 3721',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(207,'sucrlyfranco61@gmail.com','$2a$10$z5ix2oanzBkxVIn8lR7U8.sby2og.Z.KDbgzPBK5.Es7NT8CRFtCi','Franco Aceituno Lesly Sucely','client','98462490',NULL,'50081209',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(208,'ingridngalicia460@gmail.com','$2a$10$J.9YEoPf8SCNBShFKcPS2euBxsZxx/etUppuztL9RWwylAieL8peG','Galicia López Ingrid Noemí','client','107225433',NULL,'42415146',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(209,'rubengarciabarrios92@gmail.com','$2a$10$PwRlfmHxqID9kzarXKmV/ud7l0cMCSgHpTXbwc39uNWLvPO3iFb.a','García Barrios Jaime Rubén','client','86504649',NULL,'33006841',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(210,'exmargarcia64@gmail.com','$2a$10$B5HSQZcsuQEPnX/v3/dG2.Ygrv9NarYpRam4tIZPEqodB/lrLVPxa','García Hernández Exmar Magdiel','client','286405237',NULL,'39930945',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(211,'gmkenky@gmail.com','$2a$10$1f16UChZnrouLYf5qQjmo.XlH9K29mxxaTiukH1h4hqoKRb7cQ902','García Marroquin Jenry Alexánder','client','102777551',NULL,'55704977',1,'2025-12-26 21:49:13',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(212,'fragargar2004@gmail.com','$2a$10$UQQdZcF/YA7QPxKuIkpu4OMxjI/LPKCN5QUCB4Vlx/I72RUz5jCqq','Garcia y García Franklin José','client','119213400',NULL,'59336047',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(213,'garciahector2212@gmail.com','$2a$10$LoU5ym6xen09b0yRfpFTeehnmhbRAofb6v44f92w4pbE3Vd2OiqN2','García y García Héctor Sabino','client','1000098435',NULL,'32654202',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(214,'wildergodinez41@gmail.com','$2a$10$bUiX1nFF2/bCSzv8TDX8zec2tW9xGEzuXoQCZWYj/5bb99eFRTop6','Godinez Matùl Wilder Neptalí','client','74185152',NULL,'30118319',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(215,'Kasencio84@gmail.com','$2a$10$B4/hy.GffRbnMiTRmWKskuZXgCTkgk3Yn6cxh0b7R.PHB3vZ7nl02','Godoy Asencio Katerine Mishel','client','278459501',NULL,'31539529',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(216,'emeldieulaliagodoy@gmail.com','$2a$10$BDdx0ax2wy71LX8vOt3l3O1.2fmoF7heCNrKQhIVvW4ygmBbrcSbC','Godoy Chinchilla Emeldi Eulalia','client','114269173',NULL,'33361931',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(217,'gomezcarlos2207@gmail.com','$2a$10$W.etVs9lym6eqBluk6lGpuxNLGlRrsa.ZwY.ju1kwEGoc7fDhiaua','Gómez Rodríguez Carlos Roberto','client','116670207',NULL,'53736621',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(218,'milian30@hotmail.com','$2a$10$XNkIdwkV7rx3abtng.IoXuPp4VRkQduATepGP1PrK/76Tg6cuJ.bm','Gonzalez Milian Darwin Armando','client','93665865',NULL,'58510277',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(219,'gudielmoralesmarioantonio@gmail.com','$2a$10$GZEawUY8PKcDfsJ/a8vQIOJDHSb044OctCET/ym1TgrQyJwR9jFeu','Gudiel Morales Mario Antonio','client','95902430',NULL,'33958685',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(220,'rodbingudiel15@gmail.com','$2a$10$zp6E/CbVs49jBnkxeo.6J.FI.MojopVoLNSPAZ46sWAum01V88hsu','Gudiel Santos Rodbil Ruben','client','107476711',NULL,'30531235',1,'2025-12-26 21:49:14',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(221,'josuedavidhernandezcolaj@gmail.com','$2a$10$aIgdp4UNsKsRAaHiRTdez.gyP8CDXSL2b/hA3hxnbuJ4pNYXGfrGW','Hernández Colaj Josué David','client','293977240',NULL,'59529348',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(222,'jhjasminhp13@gmail.com','$2a$10$WXVDOnCRri54qbzzDRfoueqpAgR4L814Od/7GGXQXMtTSrxVXg3em','Tengo un negocio como pequeño contribuyente','client','94402760',NULL,'42262824',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(223,'herrerajerson502@gmail.com','$2a$10$jsNP7tRlOu4UwBicZV3TdeIJR6iz.MghRvCSraJcWrXSJmwy5oF3W','Herrera Palma Jerson Estuardo','client','80232515',NULL,'38601918',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(224,'gerberpinedaherrerapineda@gmail.com','$2a$10$u/oVfyovsPuC69/wHQfXM.M4e8kUmSzAxmcXBdOfrzthGH47ErRam','Herrera Pineda Gerber Jeremías','client','89041100',NULL,'33427295',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(225,'jeisonjeronimo13@gmail.com','$2a$10$B25ogm9BWrkntc8/FPmkHudmzSsHP5WanH272WFat/ZcWeB800Js6','Soy pequeño contribuyente desde el 2023','client','110103521',NULL,'42610066',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(226,'jimenezdonaldo431@gmail.com','$2a$10$/eRkZGLPA/TtbTCakOyDwOEj06A22RlQb2ipL7vpuYkGSE46M5biS','Jiménez Muñoz Josué Donaldo','client','75299399',NULL,'36247765',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(227,'fatimajochola15@gmail.com','$2a$10$BqCH2SbSianH03efjIlzf.wEjggha6EjnSb72QiMINlB6f5mowrUW','Jocholá Ajin Fatima Belinda','client','309699401',NULL,'43917187',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(228,'mabelsorezal.7@gmail.com','$2a$10$FvjHX4FErmUMw5td7yI9EOnWCAe0CBw9eXeAbAltuHrUmg8.unioG','Juarez Alfaro Mábel Sofía','client','100092411',NULL,'53189084',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(229,'jumiqueyoyi25@gmail.com','$2a$10$oalYirDG7o7BiDaNh0Ssx.SjBaovNEG/sLC/D97g.VcsMvux5fizG','Jumique Oliva Yoyi Natasha','client','305197398',NULL,'48452491',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(230,'ronyyomarlemusbetancourt550@gmail.con','$2a$10$qqxBKWU7ldTmTWjf3gS8UOBngXjR4WsdLl3A36MoxwxYiZlR/EVx2','Lemús Betancourt Rony Omar','client','96997281',NULL,'41419651',1,'2025-12-26 21:49:15',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(231,'victorialopez230517@gmail.com','$2a$10$A4CUpSNGXfaRKfrPmauBP.j1r96OppdmGAUMJqjM96/c9En4nXqu6','López Cifuentes Karla Victoria','client','97623075',NULL,'41509173',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(232,'lopezyeniffer62@gmail.com','$2a$10$o5Lq72IdEJA9HybrXANlEusD8oUdoH.OXBhgib0vufuZl5CjsDOr.','López Fajardo Yeniffer Mishell','client','104205075',NULL,'47110502',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(233,'pablitolopez667@gmail.com','$2a$10$ysVI3oc/M2Q.cpakeXZdw.YYTm11L3GThhb142ED9/plMdthgf56O','López Jiménez Pablo Ediberto','client','331051893',NULL,'57299934',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(234,'jpusuario02@gmail.com','$2a$10$Hq2N7miyeNwBPJ.GyayJuO6oxhTigPaaGvVFg44X0WGDbViEKY1Ym','López Morales José Pablo','client','109398939',NULL,'42628073',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(235,'edul39532@gmail.com','$2a$10$DRPcADg/8X6ueQaRoOa52.FdVlNn/PgSUHxQ7dAjBxpkPodWYLaaO','López Rodríguez Carlos Eduardo','client','98541757',NULL,'55325528',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(236,'aureliotema2714@hotmail.com','$2a$10$pUvZou3PwFx5BJ5KSaxmOO2kxcQmH28ooMXDgKmtlyO5drgbPRz0a','López Tema Marco Aurelio','client','83687696',NULL,'57577956',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(237,'oscarmaazjuc12@gmail.com','$2a$10$5C.vpfkyZ.qb8Lxh3Jy/vurvlUq2mDAv/3.GSbQBplt4CQoOOSucq','Maaz Juc Oscar Haroldo','client','103694293',NULL,'4803-4805',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(238,'maldonadojosue139@gmail.com','$2a$10$aYlsesm0Unb7iTtib9.xaeDAiD9CQezMom28ICm28cNbhZIESXcDO','Maldonado Fuentes Josué Alberto','client','100236251',NULL,'39955622',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(239,'maldonadoylin98@gmail.com','$2a$10$8RkN4KssRDVqBGO7VPBb0O5YwrD66A6sGuDCu2z/i2AR8WZWJdeMm','Maldonado Mejía Ylin Guadalupe','client','95948732',NULL,'35883421',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(240,'willimarroquin1995@gmail.com','$2a$10$bIKI8daXZI84RSi7Aa0oQe.YcQdPgRLnruJDMOgVh1uI4mKtn2tMa','Marroquin Castillo Willian Leonel','client','89218787',NULL,'36740687',1,'2025-12-26 21:49:16',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(241,'jesusmarro1997@gmail.com','$2a$10$5E8iHDfzyDzjJawnrYObNuUlYEHWZH9qK4EpiguwoosnIo8EPZUPG','Marroquín Marroquín Katerine Leonor De Jesús','client','110902726',NULL,'47067597',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(242,'katherininedmartinez1@gmail.com','$2a$10$rXkuGTWsVpvdi93Pp0vMDuf5Rnu3K3gJHAawuHNF.ZtS1YtO8xbua','Anteriormente si era pequeño contribuyente','client','109348575',NULL,'57144829',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(243,'santiagomartinezgomez09756@gmail.com','$2a$10$bztGf9y/UqtT.O88vyK4B.RZrFJahz30ZykYGSSqexVeblibhIbbC','Martínez Gómez Henry Santiago','client','342917080',NULL,'57695137',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(244,'jmma.251292@gmail.com','$2a$10$utMYQdJ38ZUOnRpW/3fGMuAuUhyBfddvjcV1pEqzfnfq8xRxw1S2K','Miranda Aguilar Jenner Moisés','client','83041060',NULL,'40755029',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(245,'Agustindavid703@gmail.com','$2a$10$Jtw0kLCG8A07ucHB8SMdV.SScPTgEwGGXF1VPCbvb7fuP4BWjTEBu','Miranda Agustín Enry David','client','331544733',NULL,'40926678',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(246,'florecitamiranda91@gmail.com','$2a$10$kZ2VyisbC/UK00uipPquI.bSmTKLlfKbXCKH9QAcny.JZYj0aGTSe','Miranda Castillo de Lima Flor de María','client','105416479',NULL,'37926562',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(247,'MontesdeocaMolina1997@gmail.com','$2a$10$vE2LQIw1dmRRUtfGoSRuKe.OKGyFxQhFTSLxIgmzKJwtivt8RFm6C','Yo no tengo número de contrato aun no he firmado','client','94242135',NULL,'47007589',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(248,'juanmoralesbarrios2003@gmail.com','$2a$10$OSY/IkMJuGGg0KBIM6R/cuimRK08B38f3NQVkHr/E/9MfDGMe0JEa','Morales Barrios Juan Manuel','client','117485705',NULL,'56279737',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(249,'lestermora22@gmail.com','$2a$10$4UlxpJaPpKUpmja8UzL8vOBz7WkmB7N61zSzBSF1svZ/PunDfF00.','Morales Lester Eduardo','client','89143701',NULL,'59844756',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(250,'floresvivian355@gmail.com','$2a$10$SGlXzHxfebrx.01tpkIRn.0ldFzFEkymSpZOA8e/FwvgC8539tDz2','Munguía Flores Vivian Guadalupe','client','79725244',NULL,'33920162',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(251,'Felizsanchez2206@gmail.com','$2a$10$r98nNZDbbY1pl/c.djncL.8LxKUbzM7LiZIvgbSGrMNmz4fWCuNa6','Ingrese fecha 03/09/2025','client','114673306',NULL,'55828543',1,'2025-12-26 21:49:17',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(252,'erick.0alberto@gmail.com','$2a$10$Ga8.XsRubWn06CnDxw39Ful1jLq0hX5QiTl5vMY8x9KvFUUSP3sSe','Ordóñez Tzco Erick Alberto','client','102772908',NULL,'55358736',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(253,'orozcoalfredoorozco1@gmail.com','$2a$10$o45z2JbLhR7vqL.MXvkihesRruA8RVrGwztFiNcll.zYTsSfWGPkO','Orozco Godoy Ovel Alfredo','client','84878991',NULL,'32323332',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(254,'mariadelrosarioortega493@gmail.com','$2a$10$Gcv2JScmNulymTIpW/3IWexdnV24ZgGY6Tp0A7O/HK3IzudHgzxfK','Ortega Muñoz María del Rosario','client','97948837',NULL,'41923733',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(255,'nancypablo257@gmail.com','$2a$10$KPNIiXV25Iuk/U7OhDvFBe33RE2zrhE0kMAaWSmHEzxcn5SyVKF6q','Pablo Coronado Nancy Amarilis','client','109406117',NULL,'47786019',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(256,'rv565919@gmail.com','$2a$10$18s0ySg8j0QF4dJkktw.6.T3OtMzZJXwt9DNzOnh6QA9.LLhPgo6a','Pablo Tomás Walter Osbaldo','client','96611901',NULL,'38755383',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(257,'Jhosua27931@gmail.com','$2a$10$hsevQIHvRSTwpnAqOfA20u7tPLnH7Qn5qpD3iQmjmR9o22EMML0b6','Paredes Escobar Josue Abednego','client','77548086',NULL,'4065-6048',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(258,'everardo77@gemail.com','$2a$10$M58jLULOd25JGv8l2aLlV.JV.pAtM/TzGK25aIkZfGF.T30uhOTwC','No puse numer de contrato porque no e firmado.','client','93721242',NULL,'39561117',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(259,'jspenatecorado@gmail.com','$2a$10$jLA9bHVPLNgLMom09i1bW.TuFZdCg02fHUrWFA/pGGHWlMxwtk2uS','Peñate Corado Jonathan Steven','client','342921444',NULL,'47952022',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(260,'edgar1997perez1204@gmail.com','$2a$10$/VB6CFadVLXAEnXSzDZGAeFqlr5Sy.K/MyWoKYwBEUjoV4JQqPfEC','Perez Cardona Edgar','client','99150778',NULL,'45203917',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(261,'marlinperez156@gmail.com','$2a$10$CDHqC57dqlXPsUk50h0XMeNVqonZRALk8WngBVlhxRojh2JtJ3pza','Pérez López Marlón Lavan','client','103509488',NULL,'36651663',1,'2025-12-26 21:49:18',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(262,'heidy2025perez@gmail.com','$2a$10$7mCBeaRPb/m9f9IkQ0vshuXJlaSl1H5ii9Jvgo2aVyQmAW6KumXGG','Pérez Miranda Heidy Lorena','client','109394496',NULL,'3379 6440',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(263,'joseluisps100@gmail.com','$2a$10$m6yxpAmMW0bpiooRgGVBGeu6E8lq20nWVYbpU1OcuLTUhmp3WCb3a','Pérez Solano José Luis','client','291144284',NULL,'48298495',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(264,'zamoragalicia24@gmail.com','$2a$10$akxALnJvapjpDrWbI7YQQOkptwMhd5IB2ZnlWx1Xqn8Q9IqoNpo12','Poou Caal Joel Ramiro','client','114543119',NULL,'53975019',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(265,'H.ppaoppao@gmail.com','$2a$10$d4lqCCj54YOmMCCkHYHgYeN20mwGuCDszUxuSeURaPA2Rxr6NIy8K','Quevedo Donis Helen Paola','client','116697083',NULL,'49809088',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(266,'victorrabanales411@gmail.com','$2a$10$PzsGfm2FDoLI6QA8Jv322exX1l.wGSu7h980ExzoaTwlDj6vbGSI2','Rabanales Soto Victor Enrique','client','1000126404',NULL,'5579-8966',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(267,'garciaedenilson299@gmail.com','$2a$10$E5TtbBTxz9P4STuXGV1EhewsGpBwF.7uRnW15amFyV5wxrJKxHlr.','Ramos García Edenilson Iván','client','275667715',NULL,'57245781',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(268,'brayanrivera22120199@gmail.com','$2a$10$HTW2zVda1LioLyd.1AsXPuWNUm3LICBFkBDIoIhFWVNmZ8dk/.IJu','Rivera Montoya Bryan Omar','client','99696819',NULL,'51154853',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(269,'Carlosr27rodriguez99@gmail.com','$2a$10$UOwQ15c4MdhA/SPmQLxElOLSzdpC9xiBhHXapOImZR698kjdiYpf6','Rodríguez Archila Carlos Roberto','client','117790907',NULL,'40605253',1,'2025-12-26 21:49:19',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(270,'albitha555@gmail.com','$2a$10$t5kHwuDyBtnKX6vXVVxO/.eEWO8tk97j/W7LKbzUc884OGN6wbfPy','Rodríguez Pacheco José Domingo','client','89380746',NULL,'42830804',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(271,'melvinmaza002@gmail.com','$2a$10$7/WpZPM61z1uvNK1fwi1Ke/e8lYETqDvPluU46qfgeS6DgYStsiGC','Romero Mazariegos Melvin Jonatan','client','115339434',NULL,'39684821',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(272,'ROSARIOYENER33@GMAIL.COM','$2a$10$mduT1z19eI2qpFKK7q7cl.Dfu6HnmmPDyEI/Wfeh/WJKw8Ts4kgt.','Rosario Gabriel Yener Alexander','client','118929593',NULL,'3262 4507',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(273,'fajardomishel39@gmail.com','$2a$10$KEhrDoWlMbXcw6HFt/9XweSRyu7dlkgjl30GIDgpcSXZiQLXvzKES','Sanchez Fajardo Mishel de Los Angeles','client','117328499',NULL,'55564646',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(274,'sandovalbrendy03@gmail.com','$2a$10$K8xwuplevQw7nLBzKh6gDOcICmt29mtUz0CGk7xAk2Rc203DCE05i','Sandoval Brendy Claribel','client','85566985',NULL,'47025411',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(275,'claudiadasandoval1503@gmail.com','$2a$10$6qcx9CuoekvjZujwnazxo.H9oVHL5PtKi9YqbDR59FzZtwqZc9P0u','Sandoval Latín Claudia Daniela','client','104021233',NULL,'31978049',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(276,'silvanajarrov@gmail.com','$2a$10$m4.lBy4CGvaEeNZvk.j6yuqL7pqgu/qF22dZJVIV56Jed5kZNuihe','Silva Najarro Verónica Aracely','client','275840662',NULL,'31616849',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(277,'carlossolares998@gmail.com','$2a$10$Uph1/xWGuUxCtHyhCDOCNOJl6IoQ1g.aPv7xISWhusSqEN4CAZlvm','Solares Vargas Carlos Eduardo','client','96722800',NULL,'49589820',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(278,'sosamayda2@gmail.com','$2a$10$nGFyd15B7WwOaf1I7KAdquA9VITqGF6WpXZCc029qtNEzD5eVMz56','Sosa Guerra de González Mayda Odely','client','52799433',NULL,'56239255',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(279,'sucuphernandes@gmail.com','$2a$10$wTYsE7.iuXh60ExvHEKh4ecQ6qNuwTGzKW1geKfgIeXrpOFZnlMva','Sucup Hernandez Denis Estuardo','client','326191585',NULL,'57574073',1,'2025-12-26 21:49:20',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(280,'mtobal516@gmail.com','$2a$10$/UktREVjRbEINglA9dMNCur2Or/EFistkE7k047Ywkodnoqu4Tc2W','Tobal Ríos Miguel Angel','client','362336423',NULL,'40789285',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(281,'wiliantobar88@gmail.com','$2a$10$rRjITZ7ffgcCzidExJhMiug2xh9tjjahN4YHVGsh4sp8tsZdFdAzi','Tobar Mendoza Wilian Uliser','client','106662155',NULL,'47461233',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(282,'juantomas3310@gmail.com','$2a$10$m2KPwtGsMrPviYsMViTEvOys8NCQxLRs5a3EsQSdDG6t8WtmVLyhC','Tomás Vásquez Juan Crisóstomo','client','101047452',NULL,'38070018',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(283,'alissontuells@gmail.com','$2a$10$rtLifeHPE2cK2XctS3ysiu3Pgp/S4/coGSpH.1ra6rNc6JHYYn4bW','Tuells Agustín Alisson Mariana','client','332362582',NULL,'5551 8095',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(284,'tupasaron09@gmail.com','$2a$10$ytcxG54uaAvPi4FUzAvIv.uoSqimpAwg0.s2kOymk76xCuEOKt87O','Tupas Baylón Tonny Aaron','client','103537163',NULL,'50135104',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(285,'tzunuxalexander75@gmail.com','$2a$10$8PRiOGvmIZVOYpnTlBo7lu.DVF0bg9eiSi98C3j4S.Bs/70oUYFY.','Tzunux Hernández Santiago Alexander','client','107445166',NULL,'41905740',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(286,'miguel89juare@gmail.com','$2a$10$MOhWyINtiU4uMftzJjWDeuJf7wmZhM3CnCzpJ8knfq7qg/PyAaS6.','Ulario Juárez Miguel Enrique Alexander','client','63581922',NULL,'46075888',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(287,'yesicavelasquez789@gmail.com','$2a$10$G/PI4EQqYsLHhi13o4DfBOjMqnwBSmSw1iIi/xyFYZfRBwkUG2lRy','Velásquez Marroquín Yesica Sucely','client','94997527',NULL,'46672788',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(288,'ezequielmontecino2003@gmail.com','$2a$10$s.SajCmoslCKzudS553ArO.MLQMUVbdNQYcbcKVIL0cMmNe/aQLIq','Velásquez Montecino Rolman Ezequiel','client','115957685',NULL,'49604522',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(289,'axev1997@gmail.com','$2a$10$KqTsJOrHiG9Fjo.Ncc7Hy.zTQC/gg/AThzWYLo1gYv/DIEfhx3zya','Vicente  Del Cid Axel Manolo','client','114595380',NULL,'55870897',1,'2025-12-26 21:49:21',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(290,'videsjosue329@gmail.com','$2a$10$9BxQvGGLPSg1XEP1De1vm.P1N0atAPMt2lZhBrs.sHdPAWYJQq3yG','Vides García Josué Darío','client','93624123',NULL,'58578292',1,'2025-12-26 21:49:22',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(291,'villatoroluisa917@gmail.com','$2a$10$HdxN.DO3I/b5sVV3a93SSOvLfprMkRTlCa76A4WQwax6Cl62UQ6ya','Yo facturé antes y estube declarando a 0','client','101249160',NULL,'30297347',1,'2025-12-26 21:49:22',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(292,'kevinmanfredoaraus@hotmail.com','$2a$10$F/j9VfLPuL/O0goRzVoS4ekAjhRX3BNvHXf0s1iP7P5voCVK33lD2','Araus Velasquez Kevin Manfredo','client','86864599',NULL,'32477423',1,'2025-12-26 21:49:22',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(296,'gagiron18@gmail.com','$2a$10$xwPNYgLayg/wkLQnKnciRO9Oh5v7EcSuoNEMvZqQuDXyno4fj8gve','Lizardo Gabriel Tash Giron','client','100431925',NULL,'4041-1536',1,'2025-12-26 21:49:22',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(297,'chubsoliver@gmail.com','$2a$10$jRiGHS2rVmRiuCkMXqULnODVglsAqRK2bATDG7m7fD.3WStINOVnC','Salvador Chub Coc','client','48861537',NULL,'4777-7741',1,'2025-12-26 21:49:22',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(298,'victorchebatz2014@gmail.com','$2a$10$sbp7EmAL6T/3yI7X0TsUjezGsLr8qr3Z6F3L6huFSiAZQRV.R7CiS','Victor Marcelino Che Batz','client','49779214',NULL,'3578-0415',1,'2025-12-26 21:49:23',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(299,'oscararnoldo50@gmail.com','$2a$10$WjSipMWxKr6uSkLBUuesXO3pJ2.61b2cuzUqAm4f7RVV.HEXVhWMC','Oscar Arnoldo Chu IChich','client','91758394',NULL,'4629-9360',1,'2025-12-26 21:49:23',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(300,'amary140581@gmail.com','$2a$10$14./EI0jNTyQE7CYjTUChe0Rxm9W73EOBFOlBoEHwAaMJp9Y59aKa','Ana Mary Peñate Moran','client','44667531',NULL,'3355 7716',1,'2025-12-26 21:49:23',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(301,'hilmyjulissa90@outlook.com','$2a$10$4e6sxkHETglB1JcASmNAHOawjMigRR3ZQawcLqUSRgNrPNgdDAMnu','Hilmy Julissa Menchu Anavisca','client','92815774',NULL,'4186-6819',1,'2025-12-26 21:49:23',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(302,'normabarrios1900@gmail.com','$2a$10$UiFw8fXOWAM5dGio2bKAiul7qM3oMREDAsI5MgDUFPfrp1Dq6gS/2','Norma Gladys Barrios Moreno','client','681848k',NULL,'5821-4838',1,'2025-12-26 21:49:23',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(312,'oscarloopez0174@gmail.com','$2a$10$dgGRcjuwmieopzLrChy1JO98ts0P5nlS.tUnHsvDJL2GWDgoS0zjG','Oscar Francisco Lopez Enriquez','client','16639596',NULL,'53861772',1,'2025-12-26 21:49:24',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(313,'fantonior1960@gmail.com','$2a$10$Qd0rV.z.onF8GbbQgTFDoeaEHwQmlaRaNM5OvzqqhJhaU7rJ4tDPq','Antonio Flores Reyes','client','19452713',NULL,'5453 4166',1,'2025-12-26 21:49:24',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(315,'garciajorgemartinez00@gmail.com','$2a$10$7hgnoVUypsQqiDFUPHzI3eD056AnT81D0yiEy8KtqOsOgJIeo8M56','Domingo Garcia','client','109904893',NULL,'5729-5583 3972-5719',1,'2025-12-26 21:49:24',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(316,'marlonedfrans@gmail.com','$2a$10$.seDmYcAAJH7Dl8mfjtTB.p.2yZR/KvGmiruFpRa1JP2MlY3QCnGC','Marlon Edfrans Garcia Mejia','client','99292149',NULL,'5581-0390',1,'2025-12-26 21:49:24',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(317,'24355','$2a$10$AZypf7Ku14oRWdBx5dKO2.u2A0r8ztoZBkPfvUAg9FIFdGlpx9u.y','4128 4091','client','7129459',NULL,'nogueraaroche11@gmail.com',1,'2025-12-26 21:49:24',NULL,'Desactivado automáticamente por alcanzar 5 infracciones activas','2025-12-28 04:33:36',NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(319,'Telefono','$2a$10$jTyBZ07ASX/WW78dqK7yXe3ZrUr5QAZxfe0O41dJ/wbkfwTdIGh5a','Nombre','client','Correo',NULL,'Fecha de nacimiento',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(320,'4041-1536','$2a$10$/3JvTWmlC.AgwCZM2dKne.9XzOT/68/YzoeMxG7E3rbIN6j/VFxAK','Lizardo Gabriel Tash Giron','client','gagiron18@gmail.com',NULL,'36478',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(321,'4777-7741','$2a$10$HyJ/5d6F4oAiuxRwAQyTheD9FSAgOamRNV3atHrUON.I3tCg33STy','Salvador Chub Coc','client','chubsoliver@gmail.com',NULL,'30641',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(322,'3355 7716','$2a$10$pNXXlk/ymP4tX1qNegqfO.k1zBNv1mIiXaBsi1biJmC3c8xLlS5iS','Ana Mary Peñate Moran','client','amary140581@gmail.com',NULL,'29355',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(323,'4186-6819','$2a$10$odA.4/EkGsV6CFD2.ItmjuvBnvW2vz7FMnQKdcPKNP92UziRuJTGq','Hilmy Julissa Menchu Anavisca','client','hilmyjulissa90@outlook.com',NULL,'32980',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(324,'53861772','$2a$10$uj4ppFPeZ0joweCzmowXpuF5pZdNFS5LRZom6Fj5YkWQLH/PGZ/F6','Oscar Francisco Lopez Enriquez','client','oscarloopez0174@gmail.com',NULL,'27364',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(325,'5453 4166','$2a$10$mT.HteCrOyFDaBZJzAjnJeoJsuZ0iwzXBBkn/3748pyKl8mG4hLS2','Antonio Flores Reyes','client','fantonior1960@gmail.com',NULL,'22120',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(326,'5729-5583 3972-5719','$2a$10$wZsrjm/jOmtJbJ00VpQfY.9DDU8phsgQ6kvWaz6HEijwQkblkB482','Jorge Domingo Garcia Martinez','client','garciajorgemartinez00@gmail.com',NULL,'35710',1,'2025-12-26 21:49:25',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(327,'5581-0390','$2a$10$G5JoWiTLL3RMajlV1HD7oOvGkqEkAWwPwKrcsxPa/f08LjAukHv9C','Marlon Edfrans Garcia Mejia','client','marlonedfrans@gmail.com',NULL,'35527',1,'2025-12-26 21:49:26',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(328,'3578-0415','$2a$10$.UQAiJiOqJ8.sWzS51HfCeoiD3C4AE/uo1NwC1kEgx/LWvgS7OTXu','Victor Marcelino Che Batz','client','victorchebatz2014@gmail.com',NULL,'32481',1,'2025-12-26 21:49:26',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(329,'4128 4091','$2a$10$GWJenCVhFJKOkAsJgBpfIOwt2qBxYdItUmKYmsYQN7hBg3nSo4fGC','Luis Arturo Noguera Aroche','client','nogueraaroche11@gmail.com',NULL,'24355',1,'2025-12-26 21:49:26',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(333,'cbredervidani@gmail.com','$2a$10$LDUulmno9sRic.Lr4yYtkOzYG5xIYkU2CQAT1tOxDyyUlX3R7m0Dq','Breder Vidani Cstillo Aguilar','client','69242984',NULL,'69242984',1,'2025-12-26 21:49:26',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(334,'rubisandoval254@gmail.com','$2a$10$02nREl2ufjT72mCbgw0L5u7duEHacCtz5JOXMEKfi3xAvTwBIYCb6','Rubí de los Angeles Sandoval Aguilar','client','106807625',NULL,'3679 2020',1,'2025-12-26 21:49:26',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(335,'eduardoame212@gmail.com','$2a$10$IjYwT5F9Gjzgn29Qt26H1e1.xJxe7Rjpwxq105dYqxL095Ra5US5O','Mayor','client','7031661',NULL,NULL,1,'2025-12-26 21:49:26',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(336,'hibenamadiel1@gmail.com','$2a$10$BVYzvqERQsWm1pkeKzH78.EoIr7U4ZFJPdMmiIL3SL0HD7HaPMU5a','Hiben Amadiel Santos Loy','client','66644364',NULL,NULL,1,'2025-12-26 21:49:26',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(337,'Josejulian93barillas@gmail.com','$2a$10$F/Uxka8ft8vy7bOHfiA8eONIED4GgJ1S8EQN1HBtDNLaBj2gm0HBm','José Aroldo Barillas Pérez','client','77948319',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(338,'reggigarcia11017@gmail.com','$2a$10$R49fXS8sc3tpGZnqZV8yt.dYyQGlYH5LCwB0X5DEHm2ug59dfGKW6','Edy Reginaldo Garcia Lima','client','52831515',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(339,'ricardo.portillo2016@gmail.com','$2a$10$zlORbK1pJHuseo2dzECbcuiU2M/3hWScXfA7DMnGesf1CWcg52pnq','Ricardo Aaron Portillo Rosales','client','113079214',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(340,'julioxitumul77@gmail.com','$2a$10$uLrQoA6vTUCUaobxLhjIf.0W4LH6Wejh1wkRij/7mohCpS1oIgQXq','Julio Alberto Xitumul Perez','client','40598934',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(341,'fabiomarroquin_304@provial.import','$2a$10$z7NnEVV2J8zvCEBdrBUQQ.xAJ8v.p2ED3UakMsNSGHIGTzVNUolWq','Fabio Marroquin','client','89045068',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(342,'sosabryan06@gmail.com','$2a$10$CPhHL/bYRpt4.2yWAwnZ3Odh/753gbbBkBPqwk/Gtpy83dGPHVp8e','Brayan Josue Sosa Barrios','client','104623179',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(343,'sicalismael25@gmail.com','$2a$10$6XgZkD98/3HtJVr5JONqA.4tEVhzqKU72fEANO8.Er0d4KND8zq8y','Ismael Sical Xitumul','client','1603869k',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(344,'habdalayunes@gmail.com','$2a$10$mvJlo0darvR6nxJrSHN.a.HulO9YCI2E7R4EDxa1gR4UaXoLTl38q','Jorge Habdala Yunes','client','93941331',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(345,'ialeaquinno@gmail.com','$2a$10$yxOV4t2kdF2wGMYfgBtrz.7wfIpdPlaia70ybPXahN6OPvYvP9Ijm','Esthefany Alejandra Aquino Alfaro','client','305086200',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL),
(346,'arguetamelvin34@gmail.com','$2a$10$Ard7LSiJrF4arbq4bro6Yu/CDX.78sv8wSqmp7JnxK2Xc65Ge1ZCi','Melvin Onán, Argueta Corado','client','104448547',NULL,NULL,1,'2025-12-26 21:49:27',NULL,NULL,NULL,NULL,0,NULL,NULL,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workspaces`
--

DROP TABLE IF EXISTS `workspaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspaces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL COMMENT 'Nombre del workspace (ej: Empresa ABC)',
  `slug` varchar(100) NOT NULL COMMENT 'Identificador unico para URLs',
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3b82f6' COMMENT 'Color hex para identificacion visual',
  `icon` varchar(50) DEFAULT 'building' COMMENT 'Icono del workspace',
  `is_active` tinyint(1) DEFAULT 1,
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'Workspace por defecto para nuevos usuarios',
  `created_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `max_infractions` int(11) DEFAULT 3 COMMENT 'Límite de infracciones antes de desactivar cliente',
  `auto_deactivate_on_limit` tinyint(1) DEFAULT 1,
  `infraction_color_scheme` enum('clasico','intenso','profesional','oscuro','custom') DEFAULT 'clasico',
  `infraction_color_1_bg` varchar(7) DEFAULT '#FEF3C7' COMMENT 'Color fondo 1 infracción (amarillo claro)',
  `infraction_color_1_text` varchar(7) DEFAULT '#92400E' COMMENT 'Color texto 1 infracción (amarillo oscuro)',
  `infraction_color_2_bg` varchar(7) DEFAULT '#FEE2E2' COMMENT 'Color fondo 2+ infracciones (rojo claro)',
  `infraction_color_2_text` varchar(7) DEFAULT '#991B1B' COMMENT 'Color texto 2+ infracciones (rojo oscuro)',
  `registration_code` varchar(4) DEFAULT NULL,
  `auto_approve_registration` tinyint(1) DEFAULT 0,
  `infraction_color_3_bg` varchar(7) DEFAULT NULL,
  `infraction_color_3_text` varchar(7) DEFAULT NULL,
  `infraction_color_4_bg` varchar(7) DEFAULT NULL,
  `infraction_color_4_text` varchar(7) DEFAULT NULL,
  `infraction_color_5_bg` varchar(7) DEFAULT NULL,
  `infraction_color_5_text` varchar(7) DEFAULT NULL,
  `infraction_color_6_bg` varchar(7) DEFAULT NULL,
  `infraction_color_6_text` varchar(7) DEFAULT NULL,
  `infraction_color_7_bg` varchar(7) DEFAULT NULL,
  `infraction_color_7_text` varchar(7) DEFAULT NULL,
  `infraction_color_8_bg` varchar(7) DEFAULT NULL,
  `infraction_color_8_text` varchar(7) DEFAULT NULL,
  `infraction_color_9_bg` varchar(7) DEFAULT NULL,
  `infraction_color_9_text` varchar(7) DEFAULT NULL,
  `infraction_color_10_bg` varchar(7) DEFAULT NULL,
  `infraction_color_10_text` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `registration_code` (`registration_code`),
  KEY `idx_workspaces_slug` (`slug`),
  KEY `idx_workspaces_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workspaces`
--

LOCK TABLES `workspaces` WRITE;
/*!40000 ALTER TABLE `workspaces` DISABLE KEYS */;
INSERT INTO `workspaces` VALUES
(1,'General','general','Workspace principal con todos los datos','#3b82f6','globe',1,1,NULL,'2025-12-26 18:04:17','2025-12-28 05:28:20',2,1,'intenso','#FEF3C7','#92400E','#FEE2E2','#991B1B','1001',0,NULL,NULL,NULL,NULL,'#EF4444','#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(3,'PROVIAL','provial','Clientes de PROVIAL','#10b981','truck',1,0,1,'2025-12-26 21:46:49','2025-12-28 05:17:57',2,0,'clasico','#FCD34D','#78350F','#FB923C','#7C2D12','1002',0,'#F87171','#7F1D1D','#EF4444','#FFFFFF','#EF4444','#FFFFFF',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(4,'Test Workspace','test-ws',NULL,'#3b82f6','building',1,0,1,'2025-12-27 04:21:09','2025-12-27 04:21:09',3,1,'clasico','#FEF3C7','#92400E','#FEE2E2','#991B1B','7768',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `workspaces` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-29  3:28:12
