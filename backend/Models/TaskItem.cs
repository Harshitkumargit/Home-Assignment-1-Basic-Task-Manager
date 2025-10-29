using System.ComponentModel.DataAnnotations;

namespace TaskManagerAPI.Models
{
    /// <summary>
    /// Represents a task item in the task management system
    /// </summary>
    public class TaskItem
    {
        /// <summary>
        /// Unique identifier for the task
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Description of the task
        /// </summary>
        [Required(ErrorMessage = "Description is required")]
        [StringLength(500, MinimumLength = 1, ErrorMessage = "Description must be between 1 and 500 characters")]
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Indicates whether the task is completed
        /// </summary>
        public bool IsCompleted { get; set; }

        /// <summary>
        /// Timestamp when the task was created (optional enhancement)
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
