CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(50) NOT NULL,
	`fullName` varchar(200) NOT NULL,
	`street` varchar(500) NOT NULL,
	`apt` varchar(100),
	`city` varchar(100) NOT NULL,
	`state` varchar(50) NOT NULL,
	`zip` varchar(20) NOT NULL,
	`phone` varchar(20),
	`instructions` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`isGift` boolean NOT NULL DEFAULT false,
	`giftMessage` text,
	`recipientName` varchar(200),
	`recipientAddress` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(10) NOT NULL,
	`color` varchar(7) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`productBrand` varchar(255) NOT NULL,
	`productImageUrl` varchar(500),
	`price` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	`isGift` boolean NOT NULL DEFAULT false,
	`giftMessage` text,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('confirmed','preparing','out-for-delivery','shipped','in-transit','delivered','cancelled') NOT NULL DEFAULT 'confirmed',
	`deliveryMode` enum('express','shipping') NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`deliveryFee` decimal(10,2) NOT NULL,
	`serviceFee` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tax` decimal(10,2) NOT NULL,
	`tip` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`deliveryAddress` text NOT NULL,
	`trackingNumber` varchar(100),
	`estimatedDelivery` varchar(100),
	`storeId` int,
	`driverId` int,
	`giftMessage` text,
	`recipientName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('card','apple-pay','google-pay') NOT NULL,
	`brand` varchar(20),
	`last4` varchar(4),
	`expiry` varchar(7),
	`holderName` varchar(200),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`brand` varchar(255) NOT NULL,
	`categorySlug` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`volume` varchar(50) NOT NULL,
	`abv` varchar(10) NOT NULL,
	`rating` decimal(2,1) NOT NULL DEFAULT '0.0',
	`reviewCount` int NOT NULL DEFAULT 0,
	`imageUrl` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`tastingNotes` text,
	`pairings` text,
	`expressAvailable` boolean NOT NULL DEFAULT false,
	`shippingAvailable` boolean NOT NULL DEFAULT false,
	`shippingDays` varchar(20),
	`inStock` boolean NOT NULL DEFAULT true,
	`featured` boolean NOT NULL DEFAULT false,
	`premium` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`phone` varchar(20),
	`dateOfBirth` varchar(10),
	`isAgeVerified` boolean NOT NULL DEFAULT false,
	`rewardsPoints` int NOT NULL DEFAULT 0,
	`rewardsTier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`notifPush` boolean NOT NULL DEFAULT true,
	`notifEmail` boolean NOT NULL DEFAULT true,
	`notifSms` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
