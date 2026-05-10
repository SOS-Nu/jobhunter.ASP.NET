using Microsoft.AspNetCore.StaticFiles;
using System.Text.RegularExpressions;
using System.Text;

namespace JobZone.ASP.NET.Services
{
    public interface IFileService
    {
        void CreateDirectory(string folder);
        Task<string> StoreAsync(IFormFile file, string folder);
        long GetFileLength(string fileName, string folder);
        Stream GetResource(string fileName, string folder);
        string GetContentType(string fileName);
        string ExtractTextFromPdf(IFormFile file);
        string ExtractTextFromPdf(string fileName, string folder);
    }

    public class FileService : IFileService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<FileService> _logger;
        private readonly string _baseUri;

        public FileService(IConfiguration config, ILogger<FileService> logger)
        {
            _config = config;
            _logger = logger;
            _baseUri = _config["FileUpload:BaseUri"] ?? "uploads/";
            
            // Ensure base directory exists
            if (!Directory.Exists(_baseUri))
            {
                Directory.CreateDirectory(_baseUri);
            }
        }

        public void CreateDirectory(string folder)
        {
            try
            {
                var targetPath = Path.Combine(_baseUri, folder);
                if (!Directory.Exists(targetPath))
                {
                    Directory.CreateDirectory(targetPath);
                    _logger.LogInformation(">>> CREATE DIRECTORY SUCCESS: {TargetPath}", targetPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(">>> ERROR CREATE DIRECTORY: {Message}", ex.Message);
            }
        }

        public async Task<string> StoreAsync(IFormFile file, string folder)
        {
            string cleanName = SanitizeFileName(file.FileName);
            string finalName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{cleanName}";

            var folderPath = Path.Combine(_baseUri, folder);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var finalPath = Path.Combine(folderPath, finalName);

            using (var stream = new FileStream(finalPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return finalName;
        }

        public long GetFileLength(string fileName, string folder)
        {
            var filePath = Path.Combine(_baseUri, folder, fileName);
            if (!File.Exists(filePath))
            {
                return 0;
            }
            return new FileInfo(filePath).Length;
        }

        public Stream GetResource(string fileName, string folder)
        {
            var filePath = Path.Combine(_baseUri, folder, fileName);
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"File {fileName} not found");
            }
            return new FileStream(filePath, FileMode.Open, FileAccess.Read);
        }

        public string GetContentType(string fileName)
        {
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fileName, out var contentType))
            {
                contentType = "application/octet-stream";
            }
            return contentType;
        }

        private string SanitizeFileName(string fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return "unknown_file";

            // Remove diacritics
            var normalizedString = fileName.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }
            var temp = stringBuilder.ToString().Normalize(NormalizationForm.FormC);

            // Replace specific Vietnamese characters
            temp = temp.Replace('đ', 'd').Replace('Đ', 'D');

            // Keep alphanumeric, dots and hyphens
            temp = Regex.Replace(temp, "[^a-zA-Z0-9.-]", "-");
            
            // Remove multiple consecutive hyphens
            temp = Regex.Replace(temp, "-+", "-");

            return temp;
        }
        public string ExtractTextFromPdf(IFormFile file)
        {
            try
            {
                using var stream = file.OpenReadStream();
                using var document = UglyToad.PdfPig.PdfDocument.Open(stream);
                var sb = new StringBuilder();
                foreach (var page in document.GetPages())
                {
                    sb.Append(page.Text);
                }
                var text = sb.ToString();
                _logger.LogInformation(">>> PDF EXTRACTED ({FileName}): {Length} chars", file.FileName, text.Length);
                return text;
            }
            catch (Exception ex)
            {
                _logger.LogError(">>> ERROR EXTRACTING PDF ({FileName}): {Message}", file.FileName, ex.Message);
                return string.Empty;
            }
        }

        public string ExtractTextFromPdf(string fileName, string folder)
        {
            try
            {
                var filePath = Path.Combine(_baseUri, folder, fileName);
                _logger.LogInformation(">>> [FileService] Extracting PDF from: {Path}", filePath);

                if (!File.Exists(filePath))
                {
                    _logger.LogWarning(">>> [FileService] File NOT FOUND: {Path}", filePath);
                    return string.Empty;
                }

                using var document = UglyToad.PdfPig.PdfDocument.Open(filePath);
                var sb = new StringBuilder();
                foreach (var page in document.GetPages())
                {
                    sb.Append(page.Text);
                }
                var text = sb.ToString();
                _logger.LogInformation(">>> PDF EXTRACTED ({FileName}): {Length} chars", fileName, text.Length);
                return text;
            }
            catch (Exception ex)
            {
                _logger.LogError(">>> ERROR EXTRACTING STORED PDF ({FileName}): {Message}", fileName, ex.Message);
                return string.Empty;
            }
        }
    }
}
