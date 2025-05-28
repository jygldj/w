document.addEventListener('DOMContentLoaded',  function() {
    // 从localStorage加载文章数据 
    function loadArticles() {
        const saved = localStorage.getItem('websiteArticles'); 
        if (saved) {
            return JSON.parse(saved); 
        }
        return {
            poetry: [
                { id: 1, title: "春晓", content: "春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。" }
            ],
            prose: [],
            essays: []
        };
    }
 
    let articles = loadArticles();
 
    // 保存文章数据到localStorage 
    function saveArticles() {
        localStorage.setItem('websiteArticles',  JSON.stringify(articles)); 
    }
 
    // 当前显示的分类和文章 
    let currentCategory = 'poetry';
    let currentArticleId = 1;
 
    // 初始化页面 
    function initPage() {
        const urlParams = new URLSearchParams(window.location.search); 
        const category = urlParams.get('category'); 
        const articleId = urlParams.get('id'); 
 
        if (category && articles[category]) {
            currentCategory = category;
            if (articleId) {
                currentArticleId = parseInt(articleId);
            }
        }
 
        updateCategoryTitle();
        renderArticleList();
        renderArticleContent();
    }
 
    // 更新分类标题 
    function updateCategoryTitle() {
        const titles = {
            poetry: '诗词',
            prose: '散文',
            essays: '杂记'
        };
        document.getElementById('category-title').textContent  = titles[currentCategory];
    }
 
    // 渲染文章列表（已添加序号功能）
    function renderArticleList() {
        const articleList = document.getElementById('article-list'); 
        articleList.innerHTML  = '';
 
        // 获取当前栏目的文章总数
        const totalArticles = articles[currentCategory].length;
 
        articles[currentCategory].forEach((article, index) => {
            const li = document.createElement('li'); 
            li.className  = 'article-item';
            
            // 添加序号显示 (index+1是因为数组从0开始)
            const orderSpan = document.createElement('span'); 
            orderSpan.className  = 'article-order';
            orderSpan.textContent  = `${index + 1}/${totalArticles}`;
            
            // 文章标题链接 
            const a = document.createElement('a'); 
            a.href  = '#';
            a.textContent  = article.title; 
            a.dataset.id  = article.id; 
            a.addEventListener('click',  function(e) {
                e.preventDefault(); 
                currentArticleId = parseInt(this.dataset.id); 
                renderArticleContent();
                updateUrl();
            });
 
            // 删除按钮
            const delBtn = document.createElement('button'); 
            delBtn.innerHTML  = '&times;';
            delBtn.className  = 'delete-btn';
            delBtn.dataset.id  = article.id; 
            delBtn.title  = '删除这篇文章';
            delBtn.addEventListener('click',  function(e) {
                e.stopPropagation(); 
                if(confirm(`确定要删除《${article.title} 》吗？`)) {
                    deleteArticle(article.id); 
                }
            });
 
            li.appendChild(orderSpan); 
            li.appendChild(a); 
            li.appendChild(delBtn); 
            articleList.appendChild(li); 
        });
    }
 
    // 删除文章函数 
    function deleteArticle(articleId) {
        // 过滤掉要删除的文章 
        articles[currentCategory] = articles[currentCategory].filter(
            article => article.id  !== articleId
        );
        
        // 保存更改 
        saveArticles();
        
        // 如果删除的是当前显示的文章，切换到第一篇 
        if (currentArticleId === articleId) {
            currentArticleId = articles[currentCategory][0]?.id || 0;
        }
        
        // 重新渲染
        renderArticleList();
        renderArticleContent();
        
        // 如果当前栏目没有文章了，显示提示
        if (articles[currentCategory].length === 0) {
            document.getElementById('article-content').textContent  = '该栏目暂无文章';
        }
    }
 
    // 渲染文章内容
    function renderArticleContent() {
        const article = articles[currentCategory].find(a => a.id  === currentArticleId);
        const contentElement = document.getElementById('article-content'); 
        
        if (article) {
            contentElement.textContent  = article.content; 
        }
    }
 
    // 更新URL
    function updateUrl() {
        const newUrl = `${window.location.pathname}?category=${currentCategory}&id=${currentArticleId}`; 
        window.history.pushState({},  '', newUrl);
    }
 
    // 导航栏点击事件
    document.querySelectorAll('.top-nav  a[data-category]').forEach(link => {
        link.addEventListener('click',  function(e) {
            e.preventDefault(); 
            currentCategory = this.dataset.category; 
            currentArticleId = articles[currentCategory][0]?.id || 0;
            updateCategoryTitle();
            renderArticleList();
            renderArticleContent();
            updateUrl();
        });
    });
 
    // 处理投稿表单 
    if (document.getElementById('submission-form'))  {
        const form = document.getElementById('submission-form'); 
        const fileUpload = document.getElementById('file-upload'); 
        
        // 文件上传处理 
        fileUpload.addEventListener('change',  function(e) {
            const file = e.target.files[0]; 
            if (file) {
                const reader = new FileReader();
                reader.onload  = function(e) {
                    document.getElementById('content').value  = e.target.result; 
                };
                
                if (file.name.endsWith('.txt'))  {
                    reader.readAsText(file); 
                } else if (file.name.endsWith('.doc')  || file.name.endsWith('.docx'))  {
                    alert('Word文档内容提取需要后端支持，请直接粘贴文本内容');
                }
            }
        });
        
        // 表单提交
        form.addEventListener('submit',  function(e) {
            e.preventDefault(); 
            
            const category = document.getElementById('category').value; 
            const title = document.getElementById('title').value; 
            const content = document.getElementById('content').value; 
            
            // 生成新文章ID 
            const newId = articles[category].length > 0 
                ? Math.max(...articles[category].map(a  => a.id))  + 1 
                : 1;
            
            // 添加新文章 
            articles[category].push({
                id: newId,
                title: title,
                content: content,
                date: new Date().toLocaleString()
            });
            
            // 保存到localStorage 
            saveArticles();
            
            alert('投稿成功！点击确定返回首页。');
            form.reset(); 
            
            // 跳转回首页 
            window.location.href  = 'index.html'; 
        });
        
        // 设置默认时间为当前时间 
        const now = new Date();
        const formattedDate = now.toISOString().slice(0,  16);
        document.getElementById('submit-date').value  = formattedDate;
    }
 
    // 初始化页面
    initPage();
});