using TaskManagerAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Add CORS for React frontend with proper configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:5173",  // Vite default port
                "http://localhost:3000",  // Create React App port
                "http://localhost:5174",  // Vite alternative port
                "http://localhost:4173"   // Vite preview port
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Enable credentials support
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
        Description = "A simple RESTful API for managing tasks",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Your Name",
            Email = "your.email@example.com"
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Task Manager API v1");
        c.RoutePrefix = "swagger"; // Access at /swagger
    });
}

// IMPORTANT: CORS must be placed before UseHttpsRedirection and after UseRouting
app.UseCors("AllowReactApp");
app.UseHttpsRedirection();

// In-memory storage - simple list (thread-safe for development)
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
            IsCompleted = task.IsCompleted
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

// Health check endpoint (bonus)
app.MapGet("/api/health", () => Results.Ok(new 
{ 
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    taskCount = tasks.Count
}))
.WithName("HealthCheck")
.WithDescription("API health check endpoint")
.WithTags("System")
.ExcludeFromDescription(); // Hide from main API docs

// Log startup information
Console.WriteLine("╔════════════════════════════════════════════════════════╗");
Console.WriteLine("║          🚀 Task Manager API is Running!              ║");
Console.WriteLine("╚════════════════════════════════════════════════════════╝");
Console.WriteLine($"📍 HTTP:    http://localhost:5223");
Console.WriteLine($"📍 HTTPS:   https://localhost:7166");
Console.WriteLine($"📚 Swagger: http://localhost:5223/swagger");
Console.WriteLine($"💚 Health:  http://localhost:5223/api/health");
Console.WriteLine("═══════════════════════════════════════════════════════════");

app.Run();
