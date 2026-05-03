using FluentValidation;
using JobZone.ASP.NET.DTOs.Request;

namespace JobZone.ASP.NET.Validators
{
    public class ReqLoginDTOValidator : AbstractValidator<ReqLoginDTO>
    {
        public ReqLoginDTOValidator()
        {
            RuleFor(x => x.Username).NotEmpty().WithMessage("username không được để trống");
            RuleFor(x => x.Password).NotEmpty().WithMessage("password không được để trống");
        }
    }

    public class ReqUserRegisterDTOValidator : AbstractValidator<ReqUserRegisterDTO>
    {
        public ReqUserRegisterDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Tên không được để trống");
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email không được để trống").EmailAddress().WithMessage("Email không hợp lệ");
            RuleFor(x => x.Password).NotEmpty().WithMessage("Password không được để trống").MinimumLength(6).WithMessage("Password phải có ít nhất 6 ký tự");
            RuleFor(x => x.OtpCode).NotEmpty().WithMessage("Mã OTP không được để trống");
        }
    }

    public class ReqChangePasswordDTOValidator : AbstractValidator<ReqChangePasswordDTO>
    {
        public ReqChangePasswordDTOValidator()
        {
            RuleFor(x => x.NewPassword).NotEmpty().WithMessage("Mật khẩu mới không được để trống").MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự");
        }
    }

    public class ReqSendOtpDTOValidator : AbstractValidator<ReqSendOtpDTO>
    {
        public ReqSendOtpDTOValidator()
        {
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email không được để trống").EmailAddress().WithMessage("Email không hợp lệ");
        }
    }

    public class ReqCreateCompanyDTOValidator : AbstractValidator<ReqCreateCompanyDTO>
    {
        public ReqCreateCompanyDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
        }
    }

    public class ReqCreateJobDTOValidator : AbstractValidator<ReqCreateJobDTO>
    {
        public ReqCreateJobDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
            RuleFor(x => x.Location).NotEmpty().WithMessage("location không được để trống");
        }
    }

    public class ReqCreateResumeDTOValidator : AbstractValidator<ReqCreateResumeDTO>
    {
        public ReqCreateResumeDTOValidator()
        {
            RuleFor(x => x.Email).NotEmpty().WithMessage("email không được để trống");
            RuleFor(x => x.Url).NotEmpty().WithMessage("url không được để trống (upload cv chưa thành công)");
        }
    }

    public class ReqCreateCommentDTOValidator : AbstractValidator<ReqCreateCommentDTO>
    {
        public ReqCreateCommentDTOValidator()
        {
            RuleFor(x => x.Comment).NotEmpty().WithMessage("Nội dung bình luận không được để trống");
            RuleFor(x => x.Rating).NotNull().WithMessage("Điểm đánh giá không được để trống")
                .InclusiveBetween(1, 5).WithMessage("Điểm đánh giá phải từ 1 đến 5");
            RuleFor(x => x.CompanyId).NotNull().WithMessage("ID công ty không được để trống");
        }
    }

    public class ReqUpdateCommentDTOValidator : AbstractValidator<ReqUpdateCommentDTO>
    {
        public ReqUpdateCommentDTOValidator()
        {
            RuleFor(x => x.Comment).NotEmpty().WithMessage("Nội dung bình luận không được để trống");
            RuleFor(x => x.Rating).NotNull().WithMessage("Điểm đánh giá không được để trống")
                .InclusiveBetween(1, 5).WithMessage("Điểm đánh giá phải từ 1 đến 5");
        }
    }

    // ========================
    // PERMISSION VALIDATORS (Maps from: @Valid on Permission entity)
    // ========================
    public class ReqCreatePermissionDTOValidator : AbstractValidator<ReqCreatePermissionDTO>
    {
        public ReqCreatePermissionDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
            RuleFor(x => x.ApiPath).NotEmpty().WithMessage("apiPath không được để trống");
            RuleFor(x => x.Method).NotEmpty().WithMessage("method không được để trống");
            RuleFor(x => x.Module).NotEmpty().WithMessage("module không được để trống");
        }
    }

    public class ReqUpdatePermissionDTOValidator : AbstractValidator<ReqUpdatePermissionDTO>
    {
        public ReqUpdatePermissionDTOValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id không hợp lệ");
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
            RuleFor(x => x.ApiPath).NotEmpty().WithMessage("apiPath không được để trống");
            RuleFor(x => x.Method).NotEmpty().WithMessage("method không được để trống");
            RuleFor(x => x.Module).NotEmpty().WithMessage("module không được để trống");
        }
    }

    // ========================
    // ROLE VALIDATORS (Maps from: @Valid on Role entity)
    // ========================
    public class ReqCreateRoleDTOValidator : AbstractValidator<ReqCreateRoleDTO>
    {
        public ReqCreateRoleDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
        }
    }

    public class ReqUpdateRoleDTOValidator : AbstractValidator<ReqUpdateRoleDTO>
    {
        public ReqUpdateRoleDTOValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id không hợp lệ");
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
        }
    }

    // ========================
    // USER VALIDATORS
    // ========================
    public class ReqCreateUserDTOValidator : AbstractValidator<ReqCreateUserDTO>
    {
        public ReqCreateUserDTOValidator()
        {
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email không được để trống")
                .EmailAddress().WithMessage("Email không hợp lệ");
            RuleFor(x => x.Password).NotEmpty().WithMessage("Password không được để trống")
                .MinimumLength(6).WithMessage("Password phải có ít nhất 6 ký tự");
        }
    }

    public class ReqUpdateUserDTOValidator : AbstractValidator<ReqUpdateUserDTO>
    {
        public ReqUpdateUserDTOValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id không hợp lệ");
        }
    }

    // ========================
    // WORK EXPERIENCE VALIDATORS
    // ========================
    public class ReqCreateWorkExperienceDTOValidator : AbstractValidator<ReqCreateWorkExperienceDTO>
    {
        public ReqCreateWorkExperienceDTOValidator()
        {
            RuleFor(x => x.CompanyName).NotEmpty().WithMessage("Tên công ty không được để trống");
        }
    }

    public class ReqUpdateWorkExperienceDTOValidator : AbstractValidator<ReqUpdateWorkExperienceDTO>
    {
        public ReqUpdateWorkExperienceDTOValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id không hợp lệ");
            RuleFor(x => x.CompanyName).NotEmpty().WithMessage("Tên công ty không được để trống");
        }
    }

    // ========================
    // SKILL VALIDATORS
    // ========================
    public class ReqCreateSkillDTOValidator : AbstractValidator<ReqCreateSkillDTO>
    {
        public ReqCreateSkillDTOValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
        }
    }

    public class ReqUpdateSkillDTOValidator : AbstractValidator<ReqUpdateSkillDTO>
    {
        public ReqUpdateSkillDTOValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id không hợp lệ");
            RuleFor(x => x.Name).NotEmpty().WithMessage("name không được để trống");
        }
    }

    // ========================
    // PAYMENT VALIDATORS
    // ========================
    public class ReqUpdatePaymentStatusDTOValidator : AbstractValidator<ReqUpdatePaymentStatusDTO>
    {
        public ReqUpdatePaymentStatusDTOValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0).WithMessage("Id không hợp lệ");
            RuleFor(x => x.Status).NotEmpty().WithMessage("Trạng thái không được để trống");
        }
    }
}
