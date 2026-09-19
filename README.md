


🍰 Cake Box Kakinada
A full-stack bakery e-commerce and business management platform built for Cake Box, Kakinada, with direct ordering, custom cake requests, owner operations, delivery management, and a grounded AI business assistant.

📌 Overview
Cake Box Kakinada is a real-world digital platform designed to give Cake Box an independent online presence and direct customer ordering experience.

The platform combines a customer storefront, secure authentication, bakery operations dashboard, custom cake workflow, delivery calculation, and an AI assistant powered by Retrieval-Augmented Generation (RAG).

The application uses approved Cake Box business and menu information rather than fabricated demo data.

🎯 Problem Statement
Local bakeries often depend on third-party platforms for online visibility and ordering. This can limit direct customer interaction and make custom cake requests and business operations difficult to manage digitally.

Cake Box needs a centralized platform that connects customers, products, orders, custom cakes, delivery, and bakery operations.

💡 Proposed Solution
Build a full-stack bakery platform where customers can:

Browse the live bakery catalogue

View products, variants, prices, and availability

Add products to a cart

Choose delivery or pickup

Place cash orders

Track orders

Submit custom cake requests

Upload reference images

Ask verified business questions through an AI assistant

The owner gets a dedicated dashboard to manage the bakery's catalogue, orders, custom cake requests, customers, delivery settings, and business information.

🎯 Objectives
Create an independent digital storefront for Cake Box.

Enable direct customer ordering.

Provide a structured custom cake workflow.

Centralize bakery operations.

Provide verified business information through AI.

Keep critical business logic secure on the backend.

Create a scalable foundation for future integrations.

👥 User Roles
Customer
Customers can access:

Storefront and catalogue

Product details

Cart and checkout

Delivery or pickup

Addresses

Orders and order history

Custom cake requests

AI business assistant

Account/profile

Owner
The owner can manage:

Dashboard overview

Products and variants

Categories

Prices

Availability

Featured products

Orders

Custom cake requests

Customers

Delivery configuration

Business settings

AI knowledge

🛍️ Customer Storefront
Main customer pages include:

Home
Menu
Categories
Product Details
Cart
Checkout
Login / Register
Orders
Custom Cakes
Account
Addresses
AI Assistant
About / Contact
The catalogue is dynamically loaded from Supabase rather than hardcoded into the frontend.

📋 Catalogue
The approved Cake Box menu dataset is the initial catalogue source.

Current imported catalogue:

112 unique products

113 product variants

18 categories

The AI does not generate the product catalogue. Approved menu data is imported into PostgreSQL and used as the live catalogue source.

Products support information such as:

Name

Category

Description

Price

Variant

Unit/portion

Images

Availability

Tags

Source/provenance

📦 Product Availability
Products support:

AVAILABLE
UNAVAILABLE
HIDDEN
AVAILABLE products can be displayed and ordered.

UNAVAILABLE products remain visible but cannot be ordered.

HIDDEN products are removed from the public catalogue.

This allows the owner to control the live catalogue without changing code.

🎂 Custom Cake System
Custom cakes use a separate owner-controlled workflow.

Customers can submit:

Cake requirements

Details

Mobile number

Reference image

Workflow
Customer Request
       ↓
PENDING
       ↓
Owner Review
       ↓
Quotation
       ↓
Customer Confirmation
       ↓
CONFIRMED
The AI assistant does not set custom cake prices or approve, reject, or confirm custom cake requests.

Those decisions remain under bakery/owner control.

🛒 Cart & Checkout
The cart supports:

Adding products and variants

Quantity updates

Removing items

Subtotal calculation

Persistent cart state

Checkout

The backend recalculates important values instead of trusting the browser.

Product
   ↓
Variant
   ↓
Availability
   ↓
Current Price
   ↓
Quantity
   ↓
Delivery / Pickup
   ↓
Final Total
🚚 Delivery
Current owner-confirmed delivery configuration:

Service radius: 10 km

Delivery rate: ₹7/km

Distance: Haversine calculation

Pickup fee: ₹0

Payment MVP: Cash

Customer Location
       ↓
Haversine Distance
       ↓
10 km Serviceability Check
       ↓
Distance × ₹7
       ↓
Delivery Fee
Delivery calculations are performed on the backend.

The system does not invent unsupported minimum-order, free-delivery, or delivery-time rules.

📍 Pickup
Pickup is supported as an alternative to delivery.

For pickup:

Delivery fee = ₹0

Delivery address is not required

Current payment method = Cash

Pickup lifecycle:

CONFIRMED → PREPARING → READY → PICKED_UP
📦 Order Lifecycle
Delivery
CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
Pickup
CONFIRMED → PREPARING → READY → PICKED_UP
The backend validates order information and calculates the final total.

💳 Payment
The current MVP supports cash payments.

Payment Method = CASH
The architecture can later support online payments, payment verification, and automated refunds.

🤖 AI Business Assistant
The platform includes an AI assistant designed specifically for verified Cake Box business information.

It can answer questions about:

Bakery information

Location

Opening hours

Menu

Prices

Availability

Delivery

Pickup

Ordering process

Verified policies

The assistant is not responsible for custom cake pricing or order approval.

🧠 RAG Architecture
The AI uses Retrieval-Augmented Generation.

Customer Question
       ↓
React Chat
       ↓
Express /api/chat
       ↓
Query Embedding
       ↓
Supabase pgvector
       ↓
Relevant Knowledge
       ↓
Live Catalogue Data
       ↓
Gemini
       ↓
Grounded Response
Knowledge sources include approved business information and menu data.

The implementation uses Gemini embeddings with 768-dimensional vectors.

If information is unavailable or unverified, the assistant should not guess.

🗄️ Database
Supabase PostgreSQL is the primary database.

Core entities include:

business
branches
business_hours
categories
products
product_variants
product_images
profiles
addresses
bakery_settings
orders
order_items
custom_orders
rag_knowledge_base
🔐 Authentication & Authorization
Authentication uses Supabase Auth.

Supported roles:

CUSTOMER
OWNER
Customer routes and owner routes are protected separately.

Owner access is verified on both frontend and backend.

Browser
   ↓
OwnerRoute
   ↓
Authentication
   ↓
OWNER Role
   ↓
Owner Dashboard
Backend owner APIs also verify authorization, so frontend route protection is not the only security layer.

🛡️ Security
Security features include:

Supabase authentication

Role-based access control

Protected routes

Backend owner authorization

PostgreSQL Row Level Security

Server-side price validation

Server-side delivery calculation

Address ownership validation

Environment-based secrets

Private custom cake reference storage

The Supabase service-role key and Gemini API key remain server-side.

🏪 Business Information
Current verified store hours:

10:00 AM – 10:00 PM
Daily
The application distinguishes store hours from online-ordering hours and does not automatically assume they are identical.

Business information, menu information, and volatile catalogue data are treated separately and should remain traceable to their source.

🎨 UI / UX
The public storefront follows a premium bakery-oriented design.

Authenticated dashboards use a modern SaaS interface with:

Sidebar navigation

KPI cards

Tables

Forms

Status badges

Confirmation dialogs

Responsive layouts

Dashboard Palette
#006199  Primary Blue
#8ACFF8  Light Blue
#F4EB6C  Soft Yellow
#FFD444  Accent Yellow
The interface uses Tailwind CSS, shadcn/ui, and Lucide icons.

👨‍💼 Owner Dashboard
Main sections:

Overview
Orders
Custom Cakes
Products
Categories
Customers
Delivery
Settings
Knowledge
The owner can control catalogue availability and pricing without modifying frontend code.

The dashboard uses live database information rather than fabricated business statistics.

⭐ Featured Products
The homepage can display owner-selected featured products.

The system does not falsely label random products as popular without verified popularity data.

If no products are featured, the UI can use a neutral catalogue discovery section.

🧩 Frontend
Frontend stack:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

React Router

Lucide

Frontend responsibilities include:

UI

Routing

Authentication state

Cart state

Customer workflows

Owner dashboard

API communication

⚙️ Backend
Backend stack:

Node.js

Express.js

TypeScript

Backend responsibilities include:

API routing

Authentication verification

Owner authorization

Order creation

Price validation

Delivery calculation

Custom cake workflow

AI chat

RAG retrieval

Catalogue statistics

Secure service integrations

☁️ Supabase
Supabase provides:

PostgreSQL

Authentication

Storage

pgvector

Application-specific business logic remains in the Express backend.

🧠 Gemini
Google Gemini is used for:

AI response generation

Embeddings

The RAG implementation is integrated into the TypeScript/Express backend.

📁 Project Structure
cake-box-kakinada/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── services/
│   ├── public/
│   ├── vite.config.ts
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── data/
├── scripts/
├── .env
├── package.json
└── README.md
🔌 API Areas
Main API areas include:

/api/auth
/api/orders
/api/custom-orders
/api/chat
/api/owner/*
Business-critical logic is handled through the backend.

🔄 Application Architecture
Customer
   ↓
React + TypeScript
   ↓
Express API
   ├── Supabase PostgreSQL
   ├── Supabase Auth
   ├── Supabase Storage
   ├── pgvector
   └── Gemini AI
🔄 Data Flow
Catalogue
Approved Menu
    ↓
Import
    ↓
PostgreSQL
    ↓
Express API
    ↓
React
    ↓
Customer
Order
Cart
 ↓
Checkout
 ↓
Express API
 ↓
Validate
 ↓
Calculate Price
 ↓
Calculate Delivery
 ↓
Create Order
AI
Question
 ↓
Embedding
 ↓
Vector Search
 ↓
Relevant Knowledge
 ↓
Live Catalogue
 ↓
Gemini
 ↓
Answer
🧪 Testing
Important areas tested during development include:

Customer authentication

Owner authentication

Route protection

Owner API authorization

Catalogue retrieval

Product availability

Cart operations

Regular orders

Pickup orders

Delivery serviceability

Haversine distance

Delivery fee calculation

Custom cake requests

RAG queries

Unknown AI questions

Database security

Production builds

Example delivery validation:

Bhanugudi Junction
≈ 1.71 km
≈ ₹12 delivery fee
Locations beyond 10 km are treated as non-serviceable.

🚀 Getting Started
Prerequisites
Install:

Node.js

npm

Git

Supabase project

Gemini API key

Clone
git clone <YOUR_REPOSITORY_URL>
cd cake-box-kakinada
Frontend
cd client
npm install
npm run dev
Backend
Open another terminal:

cd server
npm install
npm run dev
🔑 Environment Variables
Create a root .env file:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
Never commit .env or expose server-only keys.

🌐 Deployment
The application can be deployed as separate frontend and backend services.

Customer Browser
      ↓
Frontend Hosting
      ↓
Express Backend
      ↓
Supabase + Gemini
Production secrets should be configured through the hosting provider's secure environment variables.

📈 Scalability
The architecture can be extended with:

Online payments

Automated payment verification

Automated refunds

WhatsApp notifications

Email/SMS notifications

Advanced analytics

Inventory management

Coupons and promotions

Customer reviews

Advanced recommendations

Improved AI retrieval

🔮 Future Roadmap
Completed
Core application architecture

Supabase integration

Authentication

Database

Dynamic catalogue

Product variants

Cart

Checkout

Orders

Delivery

Pickup

Custom cake workflow

Owner dashboard

Product management

RAG knowledge base

pgvector

Gemini AI assistant

Protected owner APIs

Planned
Online payments

Automated notifications

WhatsApp integration

Advanced analytics

Inventory management

Reviews

Promotions

Advanced AI capabilities

📌 Project Status
Status: Active Development / MVP

The current platform includes customer commerce, custom cake requests, owner operations, delivery/pickup workflows, secure authentication, PostgreSQL data management, cloud storage, and a grounded AI business assistant.

🏆 Project Value
Cake Box Kakinada demonstrates how a local bakery can build its own direct digital commerce platform instead of depending entirely on third-party ordering channels.

It connects:

Customers
   +
Products
   +
Orders
   +
Custom Cakes
   +
Delivery
   +
Owner Operations
   +
Verified AI Assistance
The project focuses on real business workflows, secure architecture, real catalogue data, and a foundation that can scale into a larger bakery commerce platform.

🧰 Technology Stack
Frontend
React · TypeScript · Vite · Tailwind CSS · shadcn/ui · React Router

Backend
Node.js · Express.js · TypeScript

Cloud / Database
Supabase · PostgreSQL · Supabase Auth · Supabase Storage · pgvector

AI
Google Gemini · Gemini Embeddings · RAG

Architecture
REST APIs · RBAC · RLS · Server-side Validation · Modular Full Stack
🔒 Privacy
Never commit:

.env
Supabase Service Role Key
Gemini API Key
Private credentials
Private customer information
Use environment variables and secure deployment secrets.

📍 Business
Cake Box – Kakinada

Kakinada, Andhra Pradesh, India

⭐ Final
Cake Box Kakinada is a full-stack bakery commerce and management platform combining direct online ordering, custom cake workflows, owner operations, delivery management, and grounded AI assistance.

Built with:

React · TypeScript · Node.js · Express · Supabase · PostgreSQL · pgvector · Gemini AI · Tailwind CSS · shadcn/ui
