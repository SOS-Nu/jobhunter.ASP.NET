using Microsoft.Extensions.Options;
using Sieve.Models;
using Sieve.Services;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Enums;
using System;
using System.Linq;
using System.Collections.Generic;
namespace JobZone.ASP.NET.Configuration
{
    public class ApplicationSieveProcessor : SieveProcessor
    {
        public ApplicationSieveProcessor(IOptions<SieveOptions> options) : base(options)
        {
        }

        protected override IQueryable<TEntity> ApplyFiltering<TEntity>(SieveModel model, IQueryable<TEntity> result, object[] dataForCustomMethods = null)
        {
            if (!string.IsNullOrWhiteSpace(model?.Filters))
            {
                var filters = model.Filters.Split(',').ToList();
                var remainingFilters = new List<string>();
                var extractedValues = new List<string>();
                string targetField = null;

                // Determine which field to extract based on entity type
                if (typeof(TEntity) == typeof(Job))
                    targetField = "level";
                else if (typeof(TEntity) == typeof(Resume))
                    targetField = "status";

                if (targetField != null)
                {
                    var prefix = $"{targetField}==";

                    foreach (var filter in filters)
                    {
                        if (filter.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ||
                            filter.Contains($"|{prefix}", StringComparison.OrdinalIgnoreCase))
                        {
                            var parts = filter.Split('|');
                            bool isTargetFilter = true;
                            var tempValues = new List<string>();

                            foreach (var part in parts)
                            {
                                var trimmedPart = part.Trim();
                                if (trimmedPart.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                                {
                                    tempValues.Add(trimmedPart.Substring(prefix.Length));
                                }
                                else
                                {
                                    isTargetFilter = false;
                                    break;
                                }
                            }

                            if (isTargetFilter)
                            {
                                extractedValues.AddRange(tempValues);
                                continue;
                            }
                        }

                        remainingFilters.Add(filter);
                    }

                    if (extractedValues.Any())
                    {
                        model.Filters = remainingFilters.Any() ? string.Join(",", remainingFilters) : null;

                        if (typeof(TEntity) == typeof(Job))
                        {
                            var jobResult = result as IQueryable<Job>;
                            if (jobResult != null)
                            {
                                var parsedLevels = new List<LevelEnum>();
                                foreach (var l in extractedValues)
                                {
                                    if (Enum.TryParse<LevelEnum>(l, true, out var parsed))
                                        parsedLevels.Add(parsed);
                                }
                                if (parsedLevels.Any())
                                {
                                    result = (IQueryable<TEntity>)jobResult.Where(j => j.Level.HasValue && parsedLevels.Contains(j.Level.Value));
                                }
                            }
                        }
                        else if (typeof(TEntity) == typeof(Resume))
                        {
                            var resumeResult = result as IQueryable<Resume>;
                            if (resumeResult != null)
                            {
                                var parsedStatuses = new List<ResumeStateEnum>();
                                foreach (var s in extractedValues)
                                {
                                    if (Enum.TryParse<ResumeStateEnum>(s, true, out var parsed))
                                        parsedStatuses.Add(parsed);
                                }
                                if (parsedStatuses.Any())
                                {
                                    result = (IQueryable<TEntity>)resumeResult.Where(r => r.Status.HasValue && parsedStatuses.Contains(r.Status.Value));
                                }
                            }
                        }
                    }
                }
            }

            return base.ApplyFiltering(model, result, dataForCustomMethods);
        }

        protected override SievePropertyMapper MapProperties(SievePropertyMapper mapper)
        {
            // ==================== Job ====================
            mapper.Property<Job>(j => j.Name)
                .CanFilter()
                .CanSort();

            mapper.Property<Job>(j => j.Location)
                .CanFilter()
                .CanSort();

            mapper.Property<Job>(j => j.Address)
                .CanFilter()
                .CanSort();

            mapper.Property<Job>(j => j.Level)
                .CanFilter()
                .CanSort();

            mapper.Property<Job>(j => j.Salary)
                .CanFilter()
                .CanSort();

            mapper.Property<Job>(j => j.CreatedAt)
                .CanFilter()
                .CanSort();

            mapper.Property<Job>(j => j.UpdatedAt)
                .CanFilter()
                .CanSort();

            // ==================== User ====================
            mapper.Property<User>(u => u.Name)
                .CanFilter()
                .CanSort();

            mapper.Property<User>(u => u.Email)
                .CanFilter()
                .CanSort();

            mapper.Property<User>(u => u.Address)
                .CanFilter()
                .CanSort();

            mapper.Property<User>(u => u.CreatedAt)
                .CanFilter()
                .CanSort();

            mapper.Property<User>(u => u.UpdatedAt)
                .CanFilter()
                .CanSort();

            // ==================== Company ====================
            mapper.Property<Company>(c => c.Name)
                .CanFilter()
                .CanSort();

            mapper.Property<Company>(c => c.Address)
                .CanFilter()
                .CanSort();

            mapper.Property<Company>(c => c.Field)
                .CanFilter()
                .CanSort();

            mapper.Property<Company>(c => c.Scale)
                .CanFilter()
                .CanSort();

            mapper.Property<Company>(c => c.Location)
                .CanFilter()
                .CanSort();

            mapper.Property<Company>(c => c.CreatedAt)
                .CanFilter()
                .CanSort();

            mapper.Property<Company>(c => c.UpdatedAt)
                .CanFilter()
                .CanSort();

            // ==================== Skill ====================
            mapper.Property<Skill>(s => s.Name)
                .CanFilter()
                .CanSort();

            mapper.Property<Skill>(s => s.CreatedAt)
                .CanFilter()
                .CanSort();

            mapper.Property<Skill>(s => s.UpdatedAt)
                .CanFilter()
                .CanSort();

            // ==================== Role ====================
            mapper.Property<Role>(r => r.Name)
                .CanFilter()
                .CanSort();

            mapper.Property<Role>(r => r.Description)
                .CanFilter()
                .CanSort();

            mapper.Property<Role>(r => r.CreatedAt)
                .CanFilter()
                .CanSort();

            mapper.Property<Role>(r => r.UpdatedAt)
                .CanFilter()
                .CanSort();

            // ==================== Permission ====================
            mapper.Property<Permission>(p => p.Name)
                .CanFilter()
                .CanSort();

            mapper.Property<Permission>(p => p.ApiPath)
                .CanFilter()
                .CanSort();

            mapper.Property<Permission>(p => p.Method)
                .CanFilter()
                .CanSort();

            mapper.Property<Permission>(p => p.Module)
                .CanFilter()
                .CanSort();

            mapper.Property<Permission>(p => p.CreatedAt)
                .CanFilter()
                .CanSort();

            mapper.Property<Permission>(p => p.UpdatedAt)
                .CanFilter()
                .CanSort();

            // ==================== Resume ====================
            mapper.Property<Resume>(r => r.Email)
                .CanFilter()
                .CanSort();

            mapper.Property<Resume>(r => r.Status)
                .CanFilter()
                .CanSort();

            mapper.Property<Resume>(r => r.Score)
                .CanFilter()
                .CanSort();

            mapper.Property<Resume>(r => r.CreatedAt)
                .CanFilter()
                .CanSort();

            mapper.Property<Resume>(r => r.UpdatedAt)
                .CanFilter()
                .CanSort();

            // ==================== PaymentHistory ====================
            mapper.Property<PaymentHistory>(p => p.OrderId)
                .CanFilter()
                .CanSort();

            mapper.Property<PaymentHistory>(p => p.Status)
                .CanFilter()
                .CanSort();

            mapper.Property<PaymentHistory>(p => p.Amount)
                .CanFilter()
                .CanSort();

            mapper.Property<PaymentHistory>(p => p.CreatedAt)
                .CanFilter()
                .CanSort();

            // ==================== Comment ====================
            mapper.Property<Comment>(c => c.Rating)
                .CanFilter()
                .CanSort();

            mapper.Property<Comment>(c => c.CreatedAt)
                .CanFilter()
                .CanSort();

            return mapper;
        }
    }
}
