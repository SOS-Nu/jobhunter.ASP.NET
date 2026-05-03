const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'src/pages/admin/user.tsx',
    'src/pages/admin/role.tsx',
    'src/pages/admin/resume.tsx',
    'src/pages/admin/permission.tsx',
    'src/pages/admin/job/skill.tsx',
    'src/pages/admin/job/job.tsx',
    'src/pages/admin/company.tsx',
    'src/components/admin/payment/payment.page.tsx',
    'src/pages/home/index.tsx',
    'src/pages/company/JobListByCompany.tsx',
    'src/pages/company/index.tsx',
    'src/pages/company/CompanyReviews.tsx',
    'src/components/client/search.client.tsx',
    'src/components/client/modal/manage.account.tsx'
];

function processFile(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log("Not found:", fullPath);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove spring-filter-query-builder
    content = content.replace(/import \{.*?\} from "spring-filter-query-builder";\n/g, '');

    // Common replacements
    content = content.replace(/sort=updatedAt,desc/g, 'Sorts=-updatedAt');
    content = content.replace(/sort=createdAt,desc/g, 'Sorts=-createdAt');
    content = content.replace(/page=1&size=/g, 'Page=1&PageSize=');
    content = content.replace(/size=6/g, 'PageSize=6');
    content = content.replace(/size=5/g, 'PageSize=5');
    content = content.replace(/size=4/g, 'PageSize=4');
    content = content.replace(/size=2/g, 'PageSize=2');
    content = content.replace(/size=100/g, 'PageSize=100');
    content = content.replace(/page=\$\{page\}&size=\$\{size\}/g, 'Page=${page}&PageSize=${size}');
    content = content.replace(/page=1&size=100&sort=createdAt,desc/g, 'Page=1&PageSize=100&Sorts=-createdAt');
    content = content.replace(/page=1&size=4&sort=updatedAt,desc/g, 'Page=1&PageSize=4&Sorts=-updatedAt');
    
    // search.client.tsx fix
    content = content.replace(/const query = `filter=\$\{filterParts\.join\(" and "\)\}&sort=updatedAt,desc&page=1&size=2`;/g, 
                              'const query = `Filters=${filterParts.join(",")}&Sorts=-updatedAt&Page=1&PageSize=2`;');

    // Admin buildQuery
    if (content.includes('const buildQuery')) {
        // Rewrite the sfLike -> Filters map
        content = content.replace(/clone\.(\w+) \? q\.filter \+ " and " \+ `\$\{sfLike\(".*?", clone\.\w+\)\}` : `\$\{sfLike\(".*?", clone\.\w+\)\}`;/g, '...');
        content = content.replace(/`\$\{sfLike\("(.*?)", clone\.(.*?)\)\}`/g, '`$1@=${clone.$2}`');
        content = content.replace(/sfIn\("(.*?)", clone\.(.*?)\)\.toString\(\)/g, '`(${clone.$2.map((item: any) => "$1==" + item).join("|")})`');
        
        // params replacement
        content = content.replace(/page: params\.current/g, 'Page: params.current');
        content = content.replace(/size: params\.pageSize/g, 'PageSize: params.pageSize');
        content = content.replace(/clone\.page = clone\.current;/g, 'clone.Page = clone.current;');
        content = content.replace(/clone\.size = clone\.pageSize;/g, 'clone.PageSize = clone.pageSize;');
        
        // replace sort
        content = content.replace(/sortBy = sort\.(\w+) === "ascend" \? "sort=\w+,asc" : "sort=\w+,desc";/g, 
                                  'sortBy = sort.$1 === "ascend" ? "Sorts=$1" : "Sorts=-$1";');
        content = content.replace(/sortBy = `sort=(\w+),\$\{sort\[field\] === "ascend" \? "asc" : "desc"\}`;/g,
                                  'sortBy = `Sorts=${sort[field] === "ascend" ? "" : "-"}$1`;');
        content = content.replace(/sortBy = `sort=(\w+),\$\{sort\.(\w+) === "ascend" \? "asc" : "desc"\}`;/g,
                                  'sortBy = `Sorts=${sort.$2 === "ascend" ? "" : "-"}$1`;');
                                  
        // replace filter
        content = content.replace(/q\.filter/g, 'q.Filters');
        content = content.replace(/clone\.filter/g, 'clone.Filters');
        content = content.replace(/\.join\(" and "\)/g, '.join(",")');
        
        // job.name filter
        content = content.replace(/filterParts\.push\(`job\.name~'\*\$\{clone\.job\.name\}\*'`\);/g, 'filterParts.push(`Company.Name@=${clone.job.name}`);'); // Wait job.name in resume
        content = content.replace(/`job\.name~'\*\$\{clone\.job\.name\}\*'`/g, '`Job.Name@=${clone.job.name}`');
    }

    fs.writeFileSync(fullPath, content);
}

filesToUpdate.forEach(processFile);
console.log("Done");
