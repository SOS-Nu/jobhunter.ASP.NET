using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Services;
using Sieve.Models;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IMapper _mapper;

        public UserController(IUserService userService, IMapper mapper)
        {
            _userService = userService; _mapper = mapper;
        }

        [HttpPost("users")]
        [ApiMessage("Create a new user")]
        public async Task<IActionResult> CreateUser([FromBody] ReqCreateUserDTO dto)
        {
            if (await _userService.IsEmailExistAsync(dto.Email))
                throw new IdInvalidException($"Email {dto.Email}đã tồn tại, vui lòng sử dụng email khác.");

            var user = new User
            {
                Name = dto.Name, Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Age = dto.Age, Gender = dto.Gender, Address = dto.Address,
                CompanyId = dto.Company?.Id, RoleId = dto.Role?.Id,
                IsPublic = true, IsVip = dto.Vip
                
            };
            var created = await _userService.CreateUserAsync(user);
            return StatusCode(201, _mapper.Map<ResCreateUserDTO>(created));
        }

        [HttpDelete("users/{id}")]
        [ApiMessage("Delete a user")]
        public async Task<IActionResult> DeleteUser(long id)
        {
            var user = await _userService.GetUserByIdAsync(id)
                ?? throw new IdInvalidException($"User với id = {id} không tồn tại");
            await _userService.DeleteUserAsync(id);
            return Ok(null);
        }

        [HttpGet("users/{id}")]
        [ApiMessage("fetch user by id")]
        public async Task<IActionResult> GetUserById(long id)
        {
            var user = await _userService.GetUserByIdAsync(id)
                ?? throw new IdInvalidException($"User với id = {id} không tồn tại");
            return Ok(_mapper.Map<ResUserDTO>(user));
        }

        [HttpGet("users")]
        [ApiMessage("fetch all user")]
        public async Task<IActionResult> GetAllUsers([FromQuery] SieveModel sieveModel)
        {
            return Ok(await _userService.GetAllUsersAsync(sieveModel));
        }

        [HttpPut("users")]
        [ApiMessage("Update a user")]
        public async Task<IActionResult> UpdateUser([FromBody] ReqUpdateUserDTO dto)
        {
            var user = new User { Id = dto.Id, Name = dto.Name, Age = dto.Age, Gender = dto.Gender, Address = dto.Address, Avatar = dto.Avatar, IsVip = dto.Vip, CompanyId = dto.Company?.Id, RoleId = dto.Role?.Id };
            var updated = await _userService.UpdateUserAsync(user)
                ?? throw new IdInvalidException($"User với id = {dto.Id} không tồn tại");
            return Ok(_mapper.Map<ResUpdateUserDTO>(updated));
        }

        [HttpPut("users/update-own-info")]
        [ApiMessage("Update your own user information")]
        public async Task<IActionResult> UpdateOwnInfo([FromBody] ReqUpdateOwnUserDTO dto)
        {
            var user = new User { Id = dto.Id, Name = dto.Name, Age = dto.Age, Gender = dto.Gender, Address = dto.Address, Avatar = dto.Avatar };
            var updated = await _userService.UpdateOwnUserAsync(user);
            return Ok(_mapper.Map<ResUpdateUserDTO>(updated));
        }

        [HttpPut("users/is-public")]
        [ApiMessage("Update your public profile status")]
        public async Task<IActionResult> UpdateIsPublic([FromBody] ReqUpdateIsPublicDTO dto)
        {
            await _userService.UpdateUserIsPublicAsync(dto.Public);
            return Ok();
        }
    }
}
