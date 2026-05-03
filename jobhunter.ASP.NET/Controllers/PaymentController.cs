using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("payment/vnpay/create")]
        [ApiMessage("Create Vnpay URL")]
        public async Task<IActionResult> CreatePaymentUrl()
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var res = await _paymentService.CreatePaymentUrlAsync(ipAddress);
            return Ok(res);
        }

        [HttpGet("payment/vnpay/callback")]
        [AllowAnonymous]
        [ApiMessage("Handle VNPay callback")]
        public async Task<IActionResult> HandleCallback()
        {
            var queryParams = new Dictionary<string, string>();
            foreach (var key in HttpContext.Request.Query.Keys)
            {
                queryParams[key] = HttpContext.Request.Query[key].ToString();
            }

            var res = await _paymentService.HandleCallbackAsync(queryParams);

            if (res.Status == "error")
            {
                return BadRequest(res);
            }

            return Ok(res);
        }

        [HttpGet("payment/history")]
        [ApiMessage("Get payment history")]
        public async Task<IActionResult> GetPaymentHistory()
        {
            var res = await _paymentService.GetPaymentHistoryAsync();
            return Ok(res);
        }

        [HttpGet("payment/allhistory")]
        [ApiMessage("Get all payment history with pagination")]
        public async Task<IActionResult> GetAllPaymentHistory([FromQuery] Sieve.Models.SieveModel sieveModel)
        {
            var res = await _paymentService.GetAllPaymentHistoryAsync(sieveModel);
            return Ok(res);
        }

        [HttpGet("payment/allhistory/{id}")]
        [ApiMessage("Get payment history by ID")]
        public async Task<IActionResult> GetPaymentHistoryById(long id)
        {
            var res = await _paymentService.GetPaymentHistoryByIdAsync(id);
            return Ok(res);
        }

        [HttpPut("payment/allhistory")]
        [ApiMessage("Update payment history status")]
        public async Task<IActionResult> UpdatePaymentHistoryStatus([FromBody] ReqUpdatePaymentStatusDTO dto)
        {
            var res = await _paymentService.UpdatePaymentHistoryStatusAsync(dto);
            return Ok(res);
        }

        [HttpGet("payment/export/excel")]
        [ApiMessage("Export payment history to Excel")]
        public async Task<IActionResult> ExportPaymentExcel()
        {
            var fileBytes = await _paymentService.ExportPaymentExcelAsync();
            var filename = $"Payment_Report_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}.csv";
            return File(fileBytes, "text/csv", filename);
        }
    }
}
