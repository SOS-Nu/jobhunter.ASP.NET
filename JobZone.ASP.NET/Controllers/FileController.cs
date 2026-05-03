using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Services;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class FileController : ControllerBase
    {
        private readonly IFileService _fileService;

        public FileController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpPost("files")]
        [ApiMessage("Upload single file")]
        public async Task<IActionResult> Upload(IFormFile? file, [FromForm] string folder)
        {
            if (file == null || file.Length == 0)
            {
                throw new IdInvalidException("File is empty. Please upload a file.");
            }

            string fileName = file.FileName;
            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                throw new IdInvalidException($"Invalid file extension. only allows {string.Join(", ", allowedExtensions).Replace(".", "")}");
            }

            _fileService.CreateDirectory(folder);
            string uploadFile = await _fileService.StoreAsync(file, folder);

            var res = new ResUploadFileDTO
            {
                FileName = uploadFile,
                UploadedAt = DateTime.UtcNow
            };

            return Ok(res);
        }

        [HttpGet("files")]
        [AllowAnonymous]
        [ApiMessage("Download a file")]
        public IActionResult Download([FromQuery] string? fileName, [FromQuery] string? folder)
        {
            if (string.IsNullOrEmpty(fileName) || string.IsNullOrEmpty(folder))
            {
                throw new IdInvalidException("Missing required params : (fileName or folder) in query params.");
            }

            long fileLength = _fileService.GetFileLength(fileName, folder);
            if (fileLength == 0)
            {
                throw new IdInvalidException($"File with name = {fileName} not found.");
            }

            var resource = _fileService.GetResource(fileName, folder);
            var contentType = _fileService.GetContentType(fileName);

            return File(resource, contentType, fileName);
        }
    }
}
