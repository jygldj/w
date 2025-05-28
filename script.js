async function submitArticle(event) {
  event.preventDefault(); 
  
  const title = document.getElementById('title').value; 
  const category = document.getElementById('category').value; 
  const content = document.getElementById('content').value; 
 
  try {
    // 0. 获取用户输入的 Token（临时方案）
    const token = prompt('请输入 GitHub Token:');
    if (!token) return;
 
    // 1. 获取当前 articles.json  数据 
    const getResponse = await fetch(
      'https://api.github.com/repos/jygldj/w/contents/articles.json', 
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json' 
        }
      }
    );
    
    if (!getResponse.ok)  throw new Error('获取数据失败');
    const getData = await getResponse.json(); 
    const currentContent = JSON.parse(atob(getData.content)); 
 
    // 2. 添加新文章 
    currentContent.push({  title, category, content });
 
    // 3. 提交更新 
    const putResponse = await fetch(
      'https://api.github.com/repos/jygldj/w/contents/articles.json', 
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: `Add new article: ${title}`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(currentContent)))), 
          sha: getData.sha 
        })
      }
    );
 
    if (putResponse.ok)  {
      alert('提交成功！');
      window.location.href  = 'index.html'; 
    } else {
      throw new Error('更新失败');
    }
  } catch (error) {
    console.error(' 提交错误:', error);
    alert(`提交失败: ${error.message}`); 
  }
}