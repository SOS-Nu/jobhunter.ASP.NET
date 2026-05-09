using JobZone.ASP.NET.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace JobZone.ASP.NET.DTOs.Request
{
    public class JobBulkCreateDTO
    {
        [Required(ErrorMessage = "Tên công việc không được để trống")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Địa điểm không được để trống")]
        public string Location { get; set; } = null!;

        [Required(ErrorMessage = "địa chỉ không được để trống")]
        public string Address { get; set; } = null!;

        [Required(ErrorMessage = "Mức lương không được để trống")]
        public double Salary { get; set; }

        [Required(ErrorMessage = "Công ty không được để trống")]
        public CompanyDTO Company { get; set; } = null!;

        public int Quantity { get; set; }

        [Required(ErrorMessage = "Cấp độ không được để trống")]
        public LevelEnum Level { get; set; }

        public string? Description { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu không được để trống")]
        public string StartDate { get; set; } = null!;

        [Required(ErrorMessage = "Ngày kết thúc không được để trống")]
        public string EndDate { get; set; } = null!;

        public bool Active { get; set; }

        [Required(ErrorMessage = "Kỹ năng không được để trống")]
        public List<SkillDTO> Skills { get; set; } = new();

        public class CompanyDTO
        {
            [Required(ErrorMessage = "Company ID không được để trống")]
            public long Id { get; set; }
        }

        public class SkillDTO
        {
            [Required(ErrorMessage = "Skill ID không được để trống")]
            public long Id { get; set; }
        }
    }

    public class UserBulkCreateDTO
    {
        [Required(ErrorMessage = "Name không được để trống")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Gender không được để trống")]
        public GenderEnum Gender { get; set; }

        public string? Address { get; set; }

        public int Age { get; set; }

        [Required(ErrorMessage = "Role không được để trống")]
        public RoleDTO Role { get; set; } = null!;

        public class RoleDTO
        {
            [Required(ErrorMessage = "Role ID không được để trống")]
            public long Id { get; set; }
        }
    }

    public class SkillBulkCreateDTO
    {
        [Required(ErrorMessage = "Tên kỹ năng không được để trống")]
        public string Name { get; set; } = null!;
    }
}
