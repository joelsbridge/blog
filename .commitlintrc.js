module.exports = {
	parserPreset: 'conventional-changelog-conventionalcommits',
	rules: {
		'body-leading-blank': [1, 'always'],
		'footer-leading-blank': [1, 'always'],
		'header-max-length': [2, 'always', 72],
		'scope-case': [2, 'always', 'lower-case'],
		'subject-case': [
			2,
			'never',
			['sentence-case', 'start-case', 'pascal-case', 'upper-case']
		],
		'subject-empty': [2, 'never'],
		// 只能配一个字符，所以这条管不了中文句号「。」
		'subject-full-stop': [2, 'never', '.'],
		'type-case': [2, 'always', 'lower-case'],
		'type-empty': [2, 'never'],
		'type-enum': [
			2,
			'always',
			[
				// —— 内容 ——
				'content',   // 博客内容：新增/修改/删除文章、about 页、配图
				'docs',      // 项目文档：README、DEVELOPMENT.md、PROJECT-GUIDE.md
				// —— 站点与主题代码 ——
				'feat',      // 新功能：主题扩展、新页面、新栏目
				'fix',       // 修复 bug
				'style',     // 样式与排版：SCSS、格式调整（非逻辑变更）
				'refactor',  // 重构：不改变行为的代码调整
				'perf',      // 性能优化
				// —— 工程 ——
				'build',     // 构建系统与依赖：Gemfile、Dockerfile、package.json
				'ci',        // CI 配置：.github/workflows
				'chore',     // 杂项：.gitignore、编辑器配置
				'revert',    // 回滚
			]
		]
	}
};
