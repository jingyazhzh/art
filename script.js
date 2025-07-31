document.addEventListener('DOMContentLoaded', function() {
    const graphics = document.querySelectorAll('.graphic');
    const canvases = document.querySelectorAll('.graphic-canvas');
    
    let mouseX = 0;
    let mouseY = 0;
    let isMouseInWindow = false;
    let currentOffsetX = [0, 0, 0, 0]; // 当前横向位移值
    let currentOffsetY = [0, 0, 0, 0]; // 当前纵向位移值
    let targetOffsetX = [0, 0, 0, 0]; // 目标横向位移值
    let targetOffsetY = [0, 0, 0, 0]; // 目标纵向位移值
    let animationId = null; // 动画ID
    let lastMouseMoveTime = 0; // 上次鼠标移动时间
    let throttleDelay = 16; // 节流延迟（约60fps）
    let isMobile = window.innerWidth <= 768; // 检测是否为移动端
    
    // Canvas数据存储
    let canvasData = [];
    
    // 图片源文件
    const imageSources = [
        './media/aa.png',        // Canvas1 - 插画
        './media/图层 7.png',    // Canvas2 - 装置
        './media/图层 2.png',    // Canvas3 - 速写
        './media/图层dsa 1.png'  // Canvas4 - 关于
    ];
    
    // 图片的初始坐标配置
    const initialPositions = [
        { left: '6%', top: '50%', transform: 'translateY(-50%)' }, // Canvas1 - 继续左移
        { left: '31%', top: '50%', transform: 'translateY(-50%)' }, // Canvas2 - 继续左移
        { left: '56%', top: '50%', transform: 'translateY(-50%)' }, // Canvas3 - 继续左移
        { left: '71%', top: '50%', transform: 'translateY(-50%)' }  // Canvas4 - 继续左移
    ];
    
    // 跳转链接配置
    const linkUrls = [
        'file:///Users/maoxian/Documents/%F0%9F%93%8C%E4%B8%AA%E7%AB%99/%F0%9F%8C%B2%E7%BB%83%E4%B9%A0html/%E6%8F%92%E7%94%BB.html', // Canvas1 - 插画
        'file:///Users/maoxian/Documents/%F0%9F%93%8C%E4%B8%AA%E7%AB%99/%F0%9F%8C%B2%E7%BB%83%E4%B9%A0html/%E8%A3%85%E7%BD%AE.html', // Canvas2 - 装置
        'file:///Users/maoxian/Documents/%F0%9F%93%8C%E4%B8%AA%E7%AB%99/%F0%9F%8C%B2%E7%BB%83%E4%B9%A0html/%E9%80%9F%E5%86%99.html', // Canvas3 - 速写
        'file:///Users/maoxian/Documents/%F0%9F%93%8C%E4%B8%AA%E7%AB%99/%F0%9F%8C%B2%E7%BB%83%E4%B9%A0html/%E5%85%B3%E4%BA%8E.html'  // Canvas4 - 关于
    ];
    
    // 位移比例配置 - 横向和纵向都使用相同的比例
    const moveRatios = [4, 3, 2, 4]; // 4:3:2:4
    
    // 悬停文字配置
    const hoverTexts = [
        '插画 Illustration', // Canvas1
        '装置 Installation', // Canvas2
        '速写 Sketch',       // Canvas3
        '关于我 About'       // Canvas4
    ];
    
    // 获取移动端适配的位移参数
    function getOffsetParams() {
        if (isMobile) {
            return {
                baseOffsetX: 20, // 移动端横向基础位移量减半
                baseOffsetY: 10  // 移动端纵向基础位移量减半
            };
        } else {
            return {
                baseOffsetX: 40, // 桌面端横向基础位移量
                baseOffsetY: 20  // 桌面端纵向基础位移量
            };
        }
    }
    
    // 加载图片到Canvas
    function loadImageToCanvas(canvas, imageSrc, index) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            console.log(`Canvas ${index} 图片加载成功: ${imageSrc}`);
            
            // 设置Canvas尺寸
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // 绘制图片
            ctx.drawImage(img, 0, 0);
            
            try {
                // 尝试获取图像数据用于透明度检测
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvasData[index] = {
                    data: imageData.data,
                    width: canvas.width,
                    height: canvas.height,
                    canvas: canvas
                };
                
                console.log(`Canvas ${index} 透明度检测可用: ${canvas.width}x${canvas.height}, 像素数据长度: ${imageData.data.length}`);
                
                // 调整Canvas显示尺寸
                adjustCanvasSize(canvas, index);
            } catch (error) {
                console.warn(`Canvas ${index} 透明度检测不可用（跨域限制）:`, error.message);
                // 如果获取像素数据失败，使用fallback模式
                canvasData[index] = {
                    data: null,
                    width: canvas.width,
                    height: canvas.height,
                    canvas: canvas,
                    fallback: true
                };
                
                console.log(`Canvas ${index} 使用fallback模式，允许所有交互`);
                adjustCanvasSize(canvas, index);
            }
        };
        
        img.onerror = function() {
            console.error(`Canvas ${index} 图片加载失败: ${imageSrc}`);
            // 图片加载失败时，创建一个占位符
            canvas.width = 200;
            canvas.height = 200;
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#999';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`图片加载失败`, canvas.width/2, canvas.height/2);
            
            canvasData[index] = {
                data: null,
                width: canvas.width,
                height: canvas.height,
                canvas: canvas,
                fallback: true,
                error: true
            };
            
            adjustCanvasSize(canvas, index);
        };
        
        // 尝试设置跨域属性
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        
        console.log(`Canvas ${index} 开始加载图片: ${imageSrc}`);
    }
    
    // 调整Canvas显示尺寸
    function adjustCanvasSize(canvas, index) {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // 基础尺寸配置
        const baseSizes = {
            desktop: {
                maxWidth: [400, 300, 100, 200], // 4:3:1:2
                maxHeight: [80, 60, 20, 40]     // 4:3:1:2 (vh)
            },
            mobile: {
                maxWidth: [260, 195, 65, 130],  // 65% of desktop
                maxHeight: [52, 39, 13, 26]     // 65% of desktop (vh)
            },
            small: {
                maxWidth: [200, 150, 50, 100],  // further reduced
                maxHeight: [40, 30, 10, 20]     // further reduced (vh)
            }
        };
        
        // 确定当前尺寸配置
        let currentSizes;
        if (windowWidth <= 480) {
            currentSizes = baseSizes.small;
        } else if (windowWidth <= 768) {
            currentSizes = baseSizes.mobile;
        } else {
            currentSizes = baseSizes.desktop;
        }
        
        // 计算实际的最大高度（像素）
        const maxHeights = currentSizes.maxHeight.map(h => (h / 100) * windowHeight);
        
        const maxWidth = currentSizes.maxWidth[index];
        const maxHeight = maxHeights[index];
        
        // 计算图片的原始宽高比
        const aspectRatio = canvas.width / canvas.height;
        
        // 根据宽高比和限制计算实际尺寸
        let finalWidth, finalHeight;
        
        if (aspectRatio > 1) {
            // 宽图：以宽度为基准
            finalWidth = Math.min(maxWidth, maxHeight * aspectRatio);
            finalHeight = finalWidth / aspectRatio;
        } else {
            // 高图：以高度为基准
            finalHeight = Math.min(maxHeight, maxWidth / aspectRatio);
            finalWidth = finalHeight * aspectRatio;
        }
        
        // 应用尺寸
        canvas.style.width = finalWidth + 'px';
        canvas.style.height = finalHeight + 'px';
        canvas.style.maxWidth = 'none';
        canvas.style.maxHeight = 'none';
    }
    
    // 检查点击位置是否在非透明区域
    function isClickableArea(e, canvas, index) {
        // 如果是简单模式，直接返回true
        if (window.simpleMode) {
            return true;
        }
        
        if (!canvasData[index]) {
            return true; // 暂时返回true，确保基本交互
        }
        
        // 如果是fallback模式，允许所有交互
        if (canvasData[index].fallback) {
            return true;
        }
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 转换为Canvas坐标
        const canvasX = Math.floor((x / rect.width) * canvasData[index].width);
        const canvasY = Math.floor((y / rect.height) * canvasData[index].height);
        
        // 检查坐标是否在Canvas范围内
        if (canvasX < 0 || canvasX >= canvasData[index].width || 
            canvasY < 0 || canvasY >= canvasData[index].height) {
            return false;
        }
        
        // 检查周围区域的透明度，提高检测精度
        const checkRadius = 2; // 检查周围2像素
        let totalAlpha = 0;
        let validPixels = 0;
        
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                const checkX = canvasX + dx;
                const checkY = canvasY + dy;
                
                // 确保检查位置在Canvas范围内
                if (checkX >= 0 && checkX < canvasData[index].width && 
                    checkY >= 0 && checkY < canvasData[index].height) {
                    
                    const pixelIndex = (checkY * canvasData[index].width + checkX) * 4;
                    const alpha = canvasData[index].data[pixelIndex + 3];
                    totalAlpha += alpha;
                    validPixels++;
                }
            }
        }
        
        const averageAlpha = validPixels > 0 ? totalAlpha / validPixels : 0;
        
        // 使用平均透明度进行判断，阈值设为5
        return averageAlpha > 5;
    }
    
    // 初始化Canvas位置
    function initializePositions() {
        graphics.forEach((graphic, index) => {
            const pos = initialPositions[index];
            graphic.style.left = pos.left;
            graphic.style.top = pos.top;
            graphic.style.transform = pos.transform;
            currentOffsetX[index] = 0;
            currentOffsetY[index] = 0;
            targetOffsetX[index] = 0;
            targetOffsetY[index] = 0;
        });
    }
    
    // 运动曲线函数 - 边界区域影响减弱
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // 节流函数 - 优化性能
    function throttle(func, delay) {
        return function(...args) {
            const now = Date.now();
            if (now - lastMouseMoveTime >= delay) {
                lastMouseMoveTime = now;
                func.apply(this, args);
            }
        };
    }
    
    // 动画循环函数
    function animate() {
        let allSettled = true;
        
        graphics.forEach((graphic, index) => {
            // 如果鼠标不在窗口内，逐渐回到初始位置
            if (!isMouseInWindow) {
                targetOffsetX[index] = 0;
                targetOffsetY[index] = 0;
            }
            
            // 计算当前位移与目标位移的差值
            const diffX = targetOffsetX[index] - currentOffsetX[index];
            const diffY = targetOffsetY[index] - currentOffsetY[index];
            
            // 如果差值足够小，认为已到达目标位置
            if (Math.abs(diffX) < 0.1 && Math.abs(diffY) < 0.1) {
                currentOffsetX[index] = targetOffsetX[index];
                currentOffsetY[index] = targetOffsetY[index];
            } else {
                // 逐渐接近目标位置（缓动效果）
                currentOffsetX[index] += diffX * 0.08; // 横向缓动速度
                currentOffsetY[index] += diffY * 0.08; // 纵向缓动速度
                allSettled = false;
            }
            
            // 应用变换 - 同时应用横向和纵向位移
            const baseTransform = initialPositions[index].transform;
            graphic.style.transform = `${baseTransform} translateX(${currentOffsetX[index]}px) translateY(${currentOffsetY[index]}px)`;
        });
        
        // 持续运行动画循环，确保响应性
        animationId = requestAnimationFrame(animate);
    }
    
    // 鼠标移动事件处理 - 全窗口交互（节流优化）
    const handleMouseMove = throttle(function(e) {
        // 使用窗口中心作为参考点
        const windowCenterX = window.innerWidth / 2;
        const windowCenterY = window.innerHeight / 2;
        mouseX = e.clientX - windowCenterX;
        mouseY = e.clientY - windowCenterY;
        
        // 检查鼠标是否在窗口内并设置状态
        checkMouseInWindow();
        
        // 计算鼠标在窗口中的相对位置 (-1 到 1)
        const relativeX = mouseX / windowCenterX;
        const relativeY = mouseY / windowCenterY;
        
        // 获取适配的位移参数
        const offsetParams = getOffsetParams();
        
        // 为每个图形计算目标位移
        graphics.forEach((graphic, index) => {
            const ratio = moveRatios[index];
            
            // 应用运动曲线，边界区域影响减弱
            const easedRelativeX = easeInOutCubic(Math.abs(relativeX)) * Math.sign(relativeX);
            const easedRelativeY = easeInOutCubic(Math.abs(relativeY)) * Math.sign(relativeY);
            
            // 计算目标位移 - 纵向也使用相同的比例
            let offsetX = easedRelativeX * offsetParams.baseOffsetX * (ratio / 4);
            let offsetY = easedRelativeY * offsetParams.baseOffsetY * (ratio / 4); // 纵向使用相同的ratio比例
            
            // 设置目标位移（移除边界限制）
            targetOffsetX[index] = offsetX;
            targetOffsetY[index] = offsetY;
        });
        
        // 确保动画循环正在运行
        if (animationId === null) {
            animationId = requestAnimationFrame(animate);
        }
    }, throttleDelay);
    
    // 触摸事件处理 - 移动端适配
    function handleTouchMove(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            handleMouseMove(mouseEvent);
        }
    }
    
    // 鼠标离开窗口时保持当前位置
    function handleMouseLeave() {
        isMouseInWindow = false;
        // 不立即停止动画，让位移能够平滑完成
        // 动画循环会继续运行，直到所有图片到达目标位置
    }
    
    // 鼠标进入窗口时设置过渡效果
    function handleMouseEnter() {
        isMouseInWindow = true;
        graphics.forEach((graphic) => {
            graphic.style.transition = 'none'; // 移除CSS过渡，使用JS动画
        });
        
        // 重新启动动画循环
        if (animationId === null) {
            animationId = requestAnimationFrame(animate);
        }
    }
    
    // 检查鼠标是否在窗口内并设置状态
    function checkMouseInWindow() {
        // 检查鼠标是否在窗口范围内
        const mouseInWindow = mouseX >= -window.innerWidth/2 && 
                             mouseX <= window.innerWidth/2 && 
                             mouseY >= -window.innerHeight/2 && 
                             mouseY <= window.innerHeight/2;
        
        if (mouseInWindow && !isMouseInWindow) {
            // 鼠标在窗口内但状态未设置，触发进入效果
            handleMouseEnter();
        } else if (!mouseInWindow && isMouseInWindow) {
            // 鼠标不在窗口内但状态已设置，触发离开效果
            handleMouseLeave();
        }
    }
    
    // 点击跳转功能
    function handleClick(e, index) {
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target; // 可能是canvas或img
        const isCanvas = element.tagName === 'CANVAS';
        
        if (isCanvas) {
            // Canvas模式：检查点击位置是否在非透明区域
            if (!isClickableArea(e, element, index)) {
                return; // 点击在透明区域，不跳转
            }
        }
        // img模式：直接允许点击
        
        const url = linkUrls[index];
        if (url && url !== '#') {
            // 强制在原标签页打开
            window.location.href = url;
        } else {
            console.log(`${isCanvas ? 'Canvas' : 'img'}${index + 1}的跳转链接待设置`);
        }
    }
    
    // 悬停文字显示功能
    function showHoverText(text) {
        const hoverTextElement = document.getElementById('hover-text');
        hoverTextElement.textContent = text;
        hoverTextElement.classList.remove('default');
        hoverTextElement.classList.add('show');
    }
    
    function hideHoverText() {
        const hoverTextElement = document.getElementById('hover-text');
        hoverTextElement.textContent = '点击图标进入网站分栏';
        hoverTextElement.classList.remove('show');
        hoverTextElement.classList.add('default');
    }
    
    // 悬停交互效果
    function handleMouseOver(e, index) {
        const element = e.target; // 可能是canvas或img
        const isCanvas = element.tagName === 'CANVAS';
        
        if (isCanvas) {
            // Canvas模式：检查鼠标位置是否在非透明区域
            if (canvasData[index]) {
                // 如果是fallback模式，直接允许交互
                if (canvasData[index].fallback) {
                    element.style.cursor = 'pointer';
                    showHoverText(hoverTexts[index]);
                    return;
                }
                
                // 检查鼠标位置是否在非透明区域
                if (isClickableArea(e, element, index)) {
                    element.style.cursor = 'pointer'; // 变为点选手指
                    // 显示悬停文字
                    showHoverText(hoverTexts[index]);
                } else {
                    element.style.cursor = 'default'; // 保持默认光标
                }
            } else {
                // 如果数据未加载，暂时允许交互
                element.style.cursor = 'pointer';
                showHoverText(hoverTexts[index]);
            }
        } else {
            // img模式：直接允许交互
            element.style.cursor = 'pointer';
            showHoverText(hoverTexts[index]);
        }
    }
    
    function handleMouseOut(index) {
        // 查找对应的元素（可能是canvas或img）
        const graphics = document.querySelectorAll('.graphic');
        const element = graphics[index].querySelector('canvas, img');
        
        if (element) {
            element.style.cursor = 'default'; // 恢复普通箭头
            // 隐藏悬停文字
            hideHoverText();
        }
    }
    
    // 初始化
    initializePositions();
    
    // 初始化鼠标状态 - 检查鼠标是否在窗口内
    // 设置初始鼠标位置为窗口中心，然后检查实际位置
    mouseX = 0;
    mouseY = 0;
    isMouseInWindow = false;
    
    // 为每个Canvas添加事件监听器
    const hoverStates = [false, false, false, false]; // 为每个Canvas跟踪悬停状态
    
    // 加载所有图片到Canvas
    canvases.forEach((canvas, index) => {
        // 直接加载图片，不显示测试图案
        loadImageToCanvas(canvas, imageSources[index], index);
        
        // 点击事件
        canvas.addEventListener('click', (e) => handleClick(e, index));
        
        // 鼠标进入事件
        canvas.addEventListener('mouseover', (e) => {
            // 进入时立即检查一次
            handleMouseOver(e, index);
        });
        
        // 鼠标移动事件 - 实时检测透明度
        canvas.addEventListener('mousemove', (e) => {
            const element = e.target;
            const isCanvas = element.tagName === 'CANVAS';
            
            if (isCanvas && canvasData[index]) {
                // 如果是fallback模式，直接允许交互
                if (canvasData[index].fallback) {
                    if (!hoverStates[index]) {
                        element.style.cursor = 'pointer';
                        showHoverText(hoverTexts[index]);
                        hoverStates[index] = true;
                    }
                    return;
                }
                
                // 实时检查鼠标位置是否在非透明区域
                if (isClickableArea(e, element, index)) {
                    if (!hoverStates[index]) {
                        element.style.cursor = 'pointer';
                        showHoverText(hoverTexts[index]);
                        hoverStates[index] = true;
                    }
                } else {
                    if (hoverStates[index]) {
                        element.style.cursor = 'default';
                        hideHoverText();
                        hoverStates[index] = false;
                    }
                }
            }
        });
        
        // 鼠标离开事件
        canvas.addEventListener('mouseout', () => {
            hoverStates[index] = false;
            handleMouseOut(index);
        });
    });
    
    // 添加事件监听器 - 改为监听整个文档
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // 移动端触摸事件
    if (isMobile) {
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchstart', () => {
            isMouseInWindow = true;
            if (animationId === null) {
                animationId = requestAnimationFrame(animate);
            }
        });
    }
    
    // 窗口大小改变时重新初始化
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
        initializePositions();
        // 延迟调整Canvas尺寸，确保窗口尺寸已更新
        setTimeout(() => {
            canvases.forEach((canvas, index) => {
                adjustCanvasSize(canvas, index);
            });
        }, 100);
    });
    
    // 页面可见性变化时检查鼠标状态
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // 页面重新变为可见时，重新检查鼠标状态
            setTimeout(() => {
                checkMouseInWindow();
            }, 100);
        }
    });
    
    // 页面获得焦点时检查鼠标状态
    window.addEventListener('focus', () => {
        setTimeout(() => {
            checkMouseInWindow();
        }, 100);
    });
}); 

// 页面加载完成后执行
window.addEventListener('load', function() {
    // 可以选择使用哪种方法
    // equalizeImageHeights(); // 方法1：动态计算最高高度
    // equalizeImageHeightsResponsive(); // 方法2：响应式固定高度
    
    // 新增：计算长宽比并统一行内高度
    equalizeImageHeightsByRatio();
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        // 重新计算高度
        // equalizeImageHeights();
        // equalizeImageHeightsResponsive();
        equalizeImageHeightsByRatio();
    });
});

// 新增：通过计算长宽比来统一行内图片高度
function equalizeImageHeightsByRatio() {
    // 获取所有图片行
    const imageRows = document.querySelectorAll('.res');
    
    imageRows.forEach(row => {
        // 获取当前行中的所有图片容器
        const imageContainers = row.querySelectorAll('.image-container');
        
        if (imageContainers.length > 1) {
            // 添加CSS类
            imageContainers.forEach(container => {
                container.classList.add('ratio-calculated');
            });
            
            // 等待图片加载完成后再计算
            const images = Array.from(imageContainers).map(container => container.querySelector('img'));
            const loadedImages = images.filter(img => img.complete);
            
            if (loadedImages.length === images.length) {
                calculateAndSetHeights(imageContainers, images);
            } else {
                // 等待所有图片加载完成
                Promise.all(images.map(img => {
                    if (img.complete) {
                        return Promise.resolve(img);
                    } else {
                        return new Promise(resolve => {
                            img.onload = () => resolve(img);
                            img.onerror = () => resolve(img); // 即使加载失败也继续
                        });
                    }
                })).then(() => {
                    calculateAndSetHeights(imageContainers, images);
                });
            }
        }
    });
}

// 新增：计算并设置高度的辅助函数
function calculateAndSetHeights(containers, images) {
    // 计算每张图片的原始长宽比
    const imageRatios = [];
    
    images.forEach(img => {
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        
        if (originalWidth > 0 && originalHeight > 0) {
            const ratio = originalWidth / originalHeight;
            imageRatios.push(ratio);
        } else {
            // 如果无法获取原始尺寸，使用默认比例
            imageRatios.push(1);
        }
    });
    
    // 找到最宽的长宽比（最宽的图片）
    const maxRatio = Math.max(...imageRatios);
    
    // 计算统一高度（基于最宽图片的比例）
    const containerWidth = containers[0].offsetWidth;
    const unifiedHeight = containerWidth / maxRatio;
    
    // 设置最小和最大高度限制
    const minHeight = window.innerWidth <= 810 ? 150 : 200;
    const maxHeight = window.innerWidth >= 1440 ? 400 : 300;
    const finalHeight = Math.max(minHeight, Math.min(maxHeight, unifiedHeight));
    
    // 设置所有图片容器为相同高度
    containers.forEach((container, index) => {
        const img = images[index];
        if (img) {
            container.style.height = finalHeight + 'px';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
        }
    });
}

// 新增：响应式统一高度函数
function equalizeImageHeightsResponsive() {
    const imageContainers = document.querySelectorAll('.image-container');
    
    imageContainers.forEach(container => {
        const img = container.querySelector('img');
        if (img) {
            // 根据屏幕宽度设置不同高度
            if (window.innerWidth <= 810) {
                container.style.height = '200px';
            } else if (window.innerWidth >= 1440) {
                container.style.height = '400px';
            } else {
                container.style.height = '300px';
            }
            
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
        }
    });
}

// 触摸滑动相关变量
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isGalleryOpen = false; 