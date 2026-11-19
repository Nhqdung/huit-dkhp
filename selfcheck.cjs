const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname,"content.js"),"utf8");
const cell = textContent => ({textContent});
const head = {cells:["STT","Mã LHP","Tên lớp học phần","Sĩ số tối đa","Đã đăng ký"].map(cell),querySelector:() => ({})};
const row = {cells:["1","010100123","Lập trình web","60","57"].map(cell),querySelector:() => null};
head.textContent = head.cells.map(item => item.textContent).join(" ");
const table = {rows:[head,row]};
const declarations = source.slice(source.indexOf("  const normalize"),source.indexOf("  const host ="));
const checks = [
"assert.equal(parsePlan(\"00123, 0012301\")[0].hp,\"00123\");",
"assert.equal(parsePlan(\"00123 0012301 N1\")[0].group,\"N1\");",
"assert.equal(parsePlan(\"  \")[0],undefined);",
"assert.throws(() => parsePlan(\"001 00101\\n001 00102\"),/Trùng/);",
"assert.throws(() => parsePlan(\"001\"),/Dòng/);",
"assert.throws(() => parsePlan(\"<script> 123\"),/Dòng/);",
"assert.equal(registeredCodes(table)[0],\"010100123\");",
"assert.equal(registeredCodes(null).length,0);",
'assert.equal(normalize(" Đã   đăng ký "), "da dang ky");',
'assert.equal(findTable(["si so","da dang ky"]),table);',
'assert.equal(column(table,"ma lhp"),1);',
'assert.equal(column(table,"si so"),3);',
'assert.equal(records(table).length,1);',
'assert.equal(cells(records(table)[0])[1],"010100123");',
'assert.equal(number(cells(row)[3])-number(cells(row)[4]),3);',
'assert.equal(number(""),null);',
'assert.equal(number("Đang tải"),null);',
'assert.equal(number("0"),0);'
].join("\n");
vm.runInNewContext(declarations + checks, {assert,table,row,document:{querySelectorAll:() => [table]}});
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,"manifest.json"),"utf8"));
assert.equal(manifest.manifest_version,3);
assert.deepEqual(manifest.permissions,["storage"]);
for (const script of manifest.content_scripts[0].js) assert.ok(fs.existsSync(path.join(__dirname,script)));
console.log("Passed: table headers, row parsing, seat counts, missing values and manifest.");
const autoSource = source.slice(source.indexOf("  async function autoRegister()"),source.indexOf("  async function tick()"));
async function checkAutoQueue(registered) {
  let halted = false;
  const state = {autoContext:"HK2",plan:[{hp:"001",lhp:"00101",result:"pending"}]};
  const sandbox = {
    state,busy:false,stopped:false,epoch:0,
    context:() => "HK2",
    $:() => ({}),
    render:() => {},renderPlan:() => {},status:() => {},
    persist:async () => {},halt:() => { halted = true; },
    isRegistered:() => registered,
    courseRows:() => { throw new Error("Pending submission must be verified before selecting a course"); }
  };
  await vm.runInNewContext(autoSource + "\nautoRegister();",sandbox);
  assert.equal(halted,true);
  assert.equal(state.plan[0].result,registered ? "done" : "pending");
}
Promise.all([checkAutoQueue(false),checkAutoQueue(true)]).then(() => {
  console.log("Passed: uncertain submissions stay paused; confirmed submissions complete without resending.");
}).catch(error => { console.error(error); process.exitCode = 1; });

