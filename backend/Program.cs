using TaskManagerAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure port for deployment (Render/Azure/Railway)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add CORS for React frontend with production URLs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.SetIsOriginAllowed(origin =>
                origin.StartsWith("http://localhost") ||  // Local development
                origin.EndsWith(".vercel.app") ||         // Vercel deployments
                origin.EndsWith(".netlify.app") ||        // Netlify deployments
                origin.EndsWith(".onrender.com")          // Render deployments
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        });
});

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Task Manager API",
        Version = "v1",
        Description = "A simple RESTful API for managing tasks - PLC Home Assignment 1",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Harshit Kumar",
            Email = "kumarharshitv21@gmail.com"
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
// Enable Swagger in both Development and Production for assignment demo
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Task Manager API v1");
    c.RoutePrefix = "swagger"; // Access at /swagger
});

// IMPORTANT: CORS must be placed before UseHttpsRedirection
app.UseCors("AllowReactApp");

// Only redirect to HTTPS in production if needed
if (!app.Environment.IsDevelopment())
{
    // Comment out HTTPS redirect for free tier deployments
    // app.UseHttpsRedirection();
}

// In-memory storage - simple list (thread-safe for concurrent requests)
var tasks = new List<TaskItem>();
var nextId = 1;
var taskLock = new object(); // Thread safety for in-memory operations

// ==================== API ENDPOINTS ====================

// GET: /api/tasks - Get all tasks
app.MapGet("/api/tasks", () =>
{
    lock (taskLock)
    {
        return Results.Ok(tasks);
    }
})
.WithName("GetAllTasks")
.WithDescription("Retrieves all tasks from the system")
.WithOpenApi()
.WithTags("Tasks")
.Produces<List<TaskItem>>(StatusCodes.Status200OK);

// GET: /api/tasks/{id} - Get task by ID
app.MapGet("/api/tasks/{id:int}", (int id) =>
{
    lock (taskLock)
    {
        var task = tasks.FirstOrDefault(t => t.Id == id);
        
        if (task is null)
        {
            return Results.NotFound(new { message = $"Task with ID {id} not found" });
        }
        
        return Results.Ok(task);
    }
})
.WithName("GetTaskById")
.WithDescription("Retrieves a specific task by its ID")
.WithOpenApi()
.WithTags("Tasks")
.Produces<TaskItem>(StatusCodes.Status200OK)
.Produces(StatusCodes.Status404NotFound);

// POST: /api/tasks - Create new task
app.MapPost("/api/tasks", (TaskItem task) =>
{
    // Validate input
    if (string.IsNullOrWhiteSpace(task.Description))
    {
        return Results.BadRequest(new { message = "Description is required" });
    }

    lock (taskLock)
    {
        // Create new task with auto-incremented ID
        var newTask = new TaskItem
        {
            Id = nextId++,
            Description = task.Description.Trim(),
            IsCompleted = task.IsCompleted,
            CreatedAt = DateTime.UtcNow
        };
        
        tasks.Add(newTask);
        
        return Results.Created($"/api/tasks/{newTask.Id}", newTask);
    }
})
.WithName("CreateTask")
.WithDescription("Creates a new task")
.WithOpenApi()
.WithTags("Tasks")
.Produces<TaskItem>(StatusCodes.Status201Created)
.Produces(StatusCodes.Status400BadRequest);

// PUT: /api/tasks/{id} - Update task
app.MapPut("/api/tasks/{id:int}", (int id, TaskItem updatedTask) =>
{
    lock (taskLock)
    {
        var task = tasks.FirstOrDefault(t => t.Id == id);
        
        if (task is null)
        {
            return Results.NotFound(new { message = $"Task with ID {id} not found" });
        }

        // Validate input
        if (string.IsNullOrWhiteSpace(updatedTask.Description))
        {
            return Results.BadRequest(new { message = "Description is required" });
        }

        // Update task properties
        task.Description = updatedTask.Description.Trim();
        task.IsCompleted = updatedTask.IsCompleted;
        
        return Results.Ok(task);
    }
})
.WithName("UpdateTask")
.WithDescription("Updates an existing task")
.WithOpenApi()
.WithTags("Tasks")
.Produces<TaskItem>(StatusCodes.Status200OK)
.Produces(StatusCodes.Status400BadRequest)
.Produces(StatusCodes.Status404NotFound);

// DELETE: /api/tasks/{id} - Delete task
app.MapDelete("/api/tasks/{id:int}", (int id) =>
{
    lock (taskLock)
    {
        var task = tasks.FirstOrDefault(t => t.Id == id);
        
        if (task is null)
        {
            return Results.NotFound(new { message = $"Task with ID {id} not found" });
        }

        tasks.Remove(task);
        
        return Results.NoContent();
    }
})
.WithName("DeleteTask")
.WithDescription("Deletes a task by ID")
.WithOpenApi()
.WithTags("Tasks")
.Produces(StatusCodes.Status204NoContent)
.Produces(StatusCodes.Status404NotFound);

// Health check endpoint (bonus feature)
app.MapGet("/api/health", () => Results.Ok(new 
{ 
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    taskCount = tasks.Count,
    environment = app.Environment.EnvironmentName,
    version = "1.0.0"
}))
.WithName("HealthCheck")
.WithDescription("API health check endpoint")
.WithTags("System")
.ExcludeFromDescription();

// Root endpoint
app.MapGet("/", () => Results.Ok(new
{
    message = "Task Manager API - Home Assignment 1",
    version = "1.0.0",
    author = "Harshit Kumar",
    endpoints = new
    {
        swagger = "/swagger",
        health = "/api/health",
        tasks = "/api/tasks"
    }
}))
.WithName("Root")
.WithDescription("API information endpoint")
.ExcludeFromDescription();

// Log startup information
var environment = app.Environment.EnvironmentName;
var currentPort = port;

Console.WriteLine("╔════════════════════════════════════════════════════════╗");
Console.WriteLine("║          🚀 Task Manager API is Running!              ║");
Console.WriteLine("╚════════════════════════════════════════════════════════╝");
Console.WriteLine($"🌍 Environment: {environment}");
Console.WriteLine($"🔌 Port: {currentPort}");
Console.WriteLine($"📍 Base URL: http://0.0.0.0:{currentPort}");
Console.WriteLine($"📚 Swagger UI: http://0.0.0.0:{currentPort}/swagger");
Console.WriteLine($"💚 Health Check: http://0.0.0.0:{currentPort}/api/health");
Console.WriteLine("═══════════════════════════════════════════════════════════");

app.Run();
