const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/job/index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace URL param keys
content = content.replace(/"page"/g, '"Page"');
content = content.replace(/"size"/g, '"PageSize"');
content = content.replace(/"filter"/g, '"Filters"');
content = content.replace(/"sort"/g, '"Sorts"');

// Replace match logic for name and location
content = content.replace(/name\s*~\s*'\[\^'\]\*'/g, 'name@=([^,]+)');
content = content.replace(/location\s*~\s*'\[\^'\]\*'/g, 'location@=([^,]+)');
content = content.replace(/salary >= /g, 'salary>=');
content = content.replace(/salary <= /g, 'salary<=');
content = content.replace(/level = '\$\{l\}'/g, 'level==${l}');
content = content.replace(/\.join\(" or "\)/g, '.join("|")');
content = content.replace(/\.join\(" and "\)/g, '.join(",")');

// Replace sort
content = content.replace(/sortSalary === "asc" \? "salary" : "salary,desc"/g, 'sortSalary === "asc" ? "salary" : "-salary"');
content = content.replace(/sortTime === "oldest" \? "updatedAt,asc" : "updatedAt,desc"/g, 'sortTime === "oldest" ? "updatedAt" : "-updatedAt"');

fs.writeFileSync(filePath, content);
console.log("job page updated");
