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
    'src/components/admin/payment/payment.page.tsx'
];

filesToUpdate.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/sort=(\w+),asc/g, "Sorts=$1");
    content = content.replace(/sort=(\w+),desc/g, "Sorts=-$1");
    content = content.replace(/delete clone\.current;\n\s+delete clone\.pageSize;/g, 'delete clone.current;\n    delete clone.pageSize;\n    delete clone.filter;');
    content = content.replace(/filter: "",/g, '');
    content = content.replace(/if \(!q\.Filters\) delete q\.Filters;/g, 'if (!q.Filters) delete q.Filters;\n    delete q.filter;');

    fs.writeFileSync(fullPath, content);
});
