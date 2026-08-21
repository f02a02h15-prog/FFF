// fieldMap.js
// 中文表单字段标签 / placeholder 关键词 → 简历数据路径 的映射字典。
// 供 content.js 使用（通过 window.RESUME_FIELDS / window.RESUME_BLOCKS）。

// 单值字段（input / select）
window.RESUME_FIELDS = [
  { keys: ["姓名", "名字", "真实姓名", "本人姓名"], path: "basic.name" },
  { keys: ["性别"], path: "basic.gender" },
  { keys: ["年龄"], path: "basic.age" },
  { keys: ["出生", "生日"], path: "basic.birthDate" },
  { keys: ["民族"], path: "basic.ethnicity" },
  { keys: ["政治面貌", "政治"], path: "basic.politicalStatus" },
  { keys: ["籍贯"], path: "basic.hometown" },
  { keys: ["户口", "户籍"], path: "basic.household" },
  { keys: ["现居", "居住城市", "目前居住", "所在地", "所在城市"], path: "basic.residence" },
  { keys: ["手机", "电话", "联系", "手机号", "移动电话"], path: "basic.phone" },
  { keys: ["邮箱", "电子邮件", "e-mail", "email", "mail"], path: "basic.email" },
  { keys: ["身份证"], path: "basic.idNumber", sensitive: true },

  { keys: ["期望职位", "求职意向", "意向岗位", "目标岗位", "应聘岗位", "申请职位"], path: "intention.position" },
  { keys: ["期望行业", "意向行业", "求职行业"], path: "intention.industry" },
  { keys: ["期望城市", "意向城市", "工作城市", "期望工作地"], path: "intention.city" },
  { keys: ["工作性质", " employment", "用工形式", "岗位性质"], path: "intention.type" },
  { keys: ["期望薪资", "薪资要求", "薪水", "薪酬期望"], path: "intention.salary" },
  { keys: ["到岗", "入职时间", "可入职", "到岗时间"], path: "intention.availableDate" },
  { keys: ["实习时长", "实习周期", "可实习"], path: "intention.internDuration" },
  { keys: ["是否接受调剂", "接受调剂", "是否接受异地", "异地"], path: "intention.relocation" },

  { keys: ["学校", "毕业院校", "院校", "就读学校", "最高学历学校"], path: "education.0.school" },
  { keys: ["专业", "所学专业", "报考专业", "攻读专业"], path: "education.0.major" },
  { keys: ["学历", "最高学历", "学位"], path: "education.0.level" },
  { keys: ["入学", "开始时间", "起始时间"], path: "education.0.start" },
  { keys: ["毕业时间", "结束时间", "毕业年月"], path: "education.0.end" },
  { keys: ["gpa", "平均绩点", "绩点"], path: "education.0.gpa" },
  { keys: ["排名", "专业排名", "班级排名"], path: "education.0.rank" },

  { keys: ["英语", "cet", "四六级", "外语"], path: "skills.language" },
  { keys: ["技能", "特长", "专业技能"], path: "skills.data" },
  { keys: ["证书", "资格证", "认证"], path: "certificates" },
  { keys: ["社团", "校园经历", "学生工作"], path: "campus" },
  { keys: ["自我评价", "个人评价", "自荐信", "个人总结"], path: "selfEval" }
];

// 多行文本块（textarea / 大文本框）：把经历格式化成整段文本填入
window.RESUME_BLOCKS = [
  { keys: ["实习经历", "工作经历", "实践经历", "实习经验"], kind: "internships" },
  { keys: ["项目经历", "项目经验", "项目描述"], kind: "projects" },
  { keys: ["科研", "论文", "学术成果", "发表"], kind: "publications" },
  { keys: ["获奖", "荣誉", "奖励", "奖项"], kind: "awards" },
  { keys: ["技能", "特长", "能力"], kind: "skills" }
];
