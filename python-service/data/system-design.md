# System Design - Complete Guide for Placements

## What is System Design?
System design is the process of defining the architecture, components, modules, interfaces, and data flow of a system to satisfy specific functional and non-functional requirements. It is a critical part of senior software engineering interviews.

## Key Concepts

### Scalability
- **Vertical Scaling (Scale Up):** Add more power (CPU/RAM) to existing machines
- **Horizontal Scaling (Scale Out):** Add more machines to distribute load
- Most modern systems prefer horizontal scaling for cost and fault tolerance

### Load Balancing
Distributes incoming requests across multiple servers.
- **Round Robin:** Requests distributed sequentially
- **Least Connections:** Routes to server with fewest active connections
- **IP Hashing:** Same client always goes to same server (session persistence)

Popular tools: NGINX, AWS ALB, HAProxy

### Caching
Stores frequently accessed data in fast memory to reduce DB load.
- **Client-side caching:** Browser caches (localStorage, sessionStorage)
- **CDN caching:** Static assets cached at edge nodes
- **Server-side caching:** Redis, Memcached

**Cache Eviction Policies:**
- LRU (Least Recently Used) — most common
- LFU (Least Frequently Used)
- FIFO (First In First Out)

### Databases
**SQL (Relational):** MySQL, PostgreSQL
- ACID properties (Atomicity, Consistency, Isolation, Durability)
- Good for structured data with complex relationships

**NoSQL:** MongoDB, Cassandra, DynamoDB
- BASE properties (Basically Available, Soft state, Eventually consistent)
- Good for unstructured data, high write throughput

### CAP Theorem
A distributed system can guarantee only 2 of 3:
- **Consistency:** Every read gets the most recent write
- **Availability:** Every request gets a response
- **Partition Tolerance:** System works despite network failures

### Message Queues
Decouple services and enable async processing.
- **Kafka:** High-throughput, distributed streaming platform
- **RabbitMQ:** Traditional queue with routing features
- **AWS SQS:** Managed queue service

## System Design Process (Interview Framework)

1. **Clarify Requirements** (5 min)
   - Functional: What should the system do?
   - Non-functional: Scale, latency, availability requirements

2. **Estimate Scale** (5 min)
   - DAU (Daily Active Users)
   - Requests per second
   - Storage requirements (5 years)

3. **High-Level Design** (10 min)
   - Draw the main components
   - Client → API Gateway → Services → DB

4. **Deep Dive** (15 min)
   - Focus on bottlenecks
   - DB schema, API design, caching strategy

5. **Identify Bottlenecks** (5 min)
   - Single points of failure
   - How to scale each component

## Common System Design Problems
1. Design URL Shortener (like bit.ly)
2. Design Twitter/Instagram Feed
3. Design WhatsApp/Chat System
4. Design YouTube/Netflix (Video Streaming)
5. Design Uber/Ride-sharing
6. Design Rate Limiter
7. Design Notification System

## Key Metrics to Know
- P99 latency (99th percentile)
- Throughput (requests per second)
- Availability = Uptime / Total Time × 100%
- 99.9% = 8.7 hours downtime/year (3 nines)
- 99.99% = 52 minutes downtime/year (4 nines)
