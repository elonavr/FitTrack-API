## 📝 FitTrack API

### An Advanced Nutrition and Workout Tracking Platform

---

### 🚀 Overview

FitTrack is a modern, high-performance RESTful API designed to provide precise tracking of user nutrition, calorie consumption, and macro-nutrient goals. The system is built with a focus on data integrity, speed, and scalability, utilizing cutting-edge containerization and caching strategies.

### ⚙️ Technology Stack

| Category       | Technology            | Purpose                                                                  |
| :------------- | :-------------------- | :----------------------------------------------------------------------- |
| **Backend**    | **Node.js** (Express) | High-speed server environment.                                           |
| **Language**   | **TypeScript**        | Type-safe development for robust code.                                   |
| **Database**   | **PostgreSQL**        | Primary persistent data store.                                           |
| **ORM**        | **Prisma**            | Type-safe querying, schema management, and migrations.                   |
| **Caching**    | **Redis**             | In-memory data store for high-speed retrieval of hot data.               |
| **DevOps/Env** | **Docker**            | Containerization for consistent development and production environments. |
| **Precision**  | **Decimal.js**        | Handling of precise nutritional floating-point arithmetic.               |

### 💡 Core Features & Architectural Highlights

1.  **Macro & Calorie Tracking:** Accurate logging and real-time calculation of consumed vs. goal macros (Protein, Carbs, Fat).
2.  **Food Item Management:** Centralized database for nutritional data, accessible by all users.
3.  **Advanced Caching Strategy:**
    - **Cache-Aside:** Implemented in the Service layer to check Redis before hitting PostgreSQL for read-heavy data (e.g., `FoodItem` details).
    - **Invalidation & Write-Through:** Ensures data consistency by immediately updating or deleting cached entries upon write operations (e.g., creating a new food item).
4.  **Error Handling:** Structured error handling in the Controller layer to return correct HTTP status codes (400, 404, 500) based on specific service layer errors.

### 🐳 Getting Started (Local Development)

This project relies on Docker for running its required services (PostgreSQL and Redis).

#### Prerequisites

- Node.js (LTS version)
- npm (or yarn)
- **Docker Desktop** (Running)

#### Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/elonavr/FitTrack_API.git
    cd FitTrack_API
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start Services (Redis & DB):**
    Ensure Docker Desktop is running, then start the required services. _(Note: You may need to create a `docker-compose.yml` file for a full environment setup, but for now, we'll focus on the Redis instance you created earlier.)_

    **If using the standalone Redis container (as discussed):**

    ```bash
    docker start my-fittrack-redis
    ```

4.  **Apply Migrations (Initial Setup):**
    Set up your database schema using Prisma:

    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Run the Server:**

    ```bash
    npm run start
    # Server will start on http://localhost:5000
    ```

### 🎯 API Endpoints Example

| Endpoint                    | Method | Description                                                                      | Controller Handler             |
| :-------------------------- | :----- | :------------------------------------------------------------------------------- | :----------------------------- |
| `/api/fooditem`             | `GET`  | Retrieves a list of all food items (utilizes list caching).                      | `getAllFoodItemDetailsHandler` |
| `/api/fooditem/:foodItemId` | `GET`  | Retrieves detailed information for a specific food item (utilizes item caching). | `getFoodItemHandler`           |
| `/api/fooditem`             | `POST` | Creates a new food item (triggers cache Invalidation/Write-Through).             | `createFoodItemHandler`        |
