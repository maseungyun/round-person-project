// =================================================================



// [동글동글한 사람이 되자!] 프로젝트 - script.js 파일 (최종 완성본: DOM 패턴 배경 추가)



// =================================================================







// --- 1. 프로젝트 데이터 정의 (상수) ---







const AXIS_COUNT = 6;



const AXIS_MAX_DISTANCE = 4;



const AXIS_LABEL_OFFSET = 0.7;



const SCORE_MAX = 10;



const DISTANCE_PER_SCORE = AXIS_MAX_DISTANCE / SCORE_MAX;







const ASSIMILATION_FACTOR = 0.4;



const ROUNDNESS_THRESHOLD = 0.1; // 0.1점 이하일 때만 원으로 인정







let isPhaseTwo = false;







// Phase 1: '고민의 축'



const initialAxes = ["재력", "외모", "어휘력", "학벌", "자존감", "이성관계"];







// Phase 2: '성장의 축'



const growthAxes = ["소비 통제력", "자기 표현 매력", "사회적 공감 능력", "경쟁적 학습 능력", "자존감 안정성", "관계 구축 포용성"];







let currentAxesNames = initialAxes;



let currentAxisDistances = Array(AXIS_COUNT).fill(2.0); // 초기 점수 5점







// 💡 애니메이션 관련 변수



let finalImagePlane = null;



const TRANSITION_DELAY = 3000; // 3초 딜레이



const FLASH_OFFSET = 0.3; // '뿅' 효과를 위한 짧은 이동 거리







// --- 2. Three.js 3D 환경 설정 및 전역 변수 ---







let scene, camera, renderer, lineObject, filledMesh, raycaster, mouse;



let isDragging = false;



let draggablePoints = [];



let allGridObjects = [];







let draggedObject = null;



let videoStream = null;







// DOM 변수 (let으로 선언만)



let container, axisLabelsContainer, nextStepButton;



// 💡 웹캠 관련 DOM 변수



let webcamOverlay, webcamVideo, webcamCanvas, displayCanvas, captureButton, retakeButton;











function setupDomReferences() {



container = document.getElementById('canvas-container');



axisLabelsContainer = document.getElementById('axis-labels-container');



nextStepButton = document.getElementById('next-step-button');







// 💡 웹캠 관련 DOM 참조



webcamOverlay = document.getElementById('webcam-overlay');



webcamVideo = document.getElementById('webcam-video');



webcamCanvas = document.getElementById('webcam-canvas'); // 캡처용



displayCanvas = document.getElementById('display-canvas'); // 실시간 웹캠 표시용



captureButton = document.getElementById('capture-button');



retakeButton = document.getElementById('retake-button');



}







// ★★★ 수정된 부분: 배경 패턴 생성 함수 (DOM 조작) ★★★



function createBackgroundPattern() {



const patternDiv = document.createElement('div');



patternDiv.id = 'background-pattern-overlay';





// CSS로 배경 패턴 스타일 정의



patternDiv.style.cssText = `



position: fixed;



top: 0;



left: 0;



width: 200vw;



height: 200vh;



z-index: 0;



pointer-events: none;



opacity: 0.1;



transform: rotate(-10deg) scale(1.5);



transform-origin: center center;



color: #FFCC99; /* 파스텔 오렌지색 */



font-family: 'ButtonFont', sans-serif;



font-size: 30px;



line-height: 5vh;



white-space: pre; /* 줄바꿈 및 공백 유지 */



text-align: center;



overflow: hidden;



`;





// 패턴 텍스트 생성 (수동 반복)



const patternText = Array(20).fill("동글동글 동글동글 동글동글 동글동글 동글동글").join('\n');



patternDiv.textContent = patternText;





document.body.prepend(patternDiv);



}



// ***************************************************************











function initThreeJS() {



setupDomReferences();







// 웹캠 버튼 디자인 통일



if (captureButton) {



captureButton.classList.add('ui-button');



captureButton.type = 'button';



}



if (retakeButton) {



retakeButton.classList.add('ui-button');



retakeButton.type = 'button';



}







scene = new THREE.Scene();



scene.background = new THREE.Color(0xffffff);







renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });



renderer.setSize(window.innerWidth, window.innerHeight);



container.appendChild(renderer.domElement);





// 카메라 설정



camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);



camera.position.z = 8;



camera.position.y = -0.7;







const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);



scene.add(ambientLight);



const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);



directionalLight.position.set(5, 5, 5);



scene.add(directionalLight);







raycaster = new THREE.Raycaster();



mouse = new THREE.Vector2();







createGridLines();



createDraggablePolyhedron();







renderer.domElement.addEventListener('mousedown', onMouseDown, false);



document.addEventListener('mousemove', onMouseMove, false);



document.addEventListener('mouseup', onMouseUp, false);







// 💡 웹캠 버튼 이벤트 리스너



if (captureButton) captureButton.addEventListener('click', captureSnapshot);



if (retakeButton) retakeButton.addEventListener('click', startWebcam);







if (nextStepButton) nextStepButton.onclick = goToPhase2;







animate();



window.addEventListener('resize', onWindowResize, false);



}











// --- 4. 육각형/다면체 생성 및 시각화 로직 (이전과 동일) ---







function createGridLines() {



allGridObjects.forEach(obj => scene.remove(obj));



allGridObjects = [];







const lineMaterial = new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.5 });







for (let i = 1; i <= SCORE_MAX; i++) {



const radius = i * DISTANCE_PER_SCORE;



const points = [];







for (let j = 0; j < AXIS_COUNT; j++) {



const angle = j / AXIS_COUNT * Math.PI * 2;



points.push(new THREE.Vector3(



Math.cos(angle) * radius,



Math.sin(angle) * radius,



0



));



}







points.push(points[0].clone());



const geometry = new THREE.BufferGeometry().setFromPoints(points);



const line = new THREE.Line(geometry, lineMaterial);



scene.add(line);



allGridObjects.push(line);



}







for (let i = 0; i < AXIS_COUNT; i++) {



const angle = i / AXIS_COUNT * Math.PI * 2;



const points = [



new THREE.Vector3(0, 0, 0),



new THREE.Vector3(Math.cos(angle) * AXIS_MAX_DISTANCE, Math.sin(angle) * AXIS_MAX_DISTANCE, 0)



];



const geometry = new THREE.BufferGeometry().setFromPoints(points);



const line = new THREE.Line(geometry, lineMaterial);



scene.add(line);



allGridObjects.push(line);



}



}











function createDraggablePolyhedron() {



if (lineObject) scene.remove(lineObject);



if (filledMesh) scene.remove(filledMesh);



draggablePoints.forEach(point => scene.remove(point));



draggablePoints = [];







const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);



const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });







for (let i = 0; i < AXIS_COUNT; i++) {



const point = new THREE.Mesh(pointGeometry, pointMaterial);







point.name = currentAxesNames[i];



point.userData.axisIndex = i;







const angle = i / AXIS_COUNT * Math.PI * 2;



point.position.x = Math.cos(angle) * currentAxisDistances[i];



point.position.y = Math.sin(angle) * currentAxisDistances[i];



point.position.z = 0;







scene.add(point);



draggablePoints.push(point);



}







updatePolyhedronVisualization();



}











function updatePolyhedronVisualization() {



if (lineObject) scene.remove(lineObject);



if (filledMesh) scene.remove(filledMesh);







const vertices = [];



const shapePoints = [];







for (let i = 0; i < AXIS_COUNT; i++) {



const pos = draggablePoints[i].position;



shapePoints.push(new THREE.Vector2(pos.x, pos.y));



vertices.push(pos);



}







const shape = new THREE.Shape(shapePoints);



const geometry = new THREE.ShapeGeometry(shape);







const material = new THREE.MeshBasicMaterial({



color: 0x90EE90,



transparent: true,



opacity: 0.6,



side: THREE.DoubleSide



});







filledMesh = new THREE.Mesh(geometry, material);



filledMesh.position.z = -0.01;



scene.add(filledMesh);







vertices.push(vertices[0].clone());



const lineGeometry = new THREE.BufferGeometry().setFromPoints(vertices);



const lineMaterial = new THREE.LineBasicMaterial({ color: 0x40e0d0, linewidth: 2 });



lineObject = new THREE.Line(lineGeometry, lineMaterial);







scene.add(lineObject);



}







function toggleVisualization(show) {



const isVisible = show ? true : false;







allGridObjects.forEach(obj => obj.visible = isVisible);







if (lineObject) lineObject.visible = isVisible;



if (filledMesh) filledMesh.visible = isVisible;







draggablePoints.forEach(point => point.visible = isVisible);







axisLabelsContainer.style.display = isVisible ? 'block' : 'none';



}











// --- 4. 드래그 이벤트 핸들러 (이전과 동일) ---







function onMouseDown(event) {



const rect = renderer.domElement.getBoundingClientRect();



mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;



mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;







raycaster.setFromCamera(mouse, camera);



const intersects = raycaster.intersectObjects(draggablePoints);







if (intersects.length > 0) {



isDragging = true;



draggedObject = intersects[0].object;



renderer.domElement.style.cursor = 'grabbing';



}



}







function onMouseMove(event) {



if (!isDragging || !draggedObject) return;







const rect = renderer.domElement.getBoundingClientRect();



mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;



mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;







raycaster.setFromCamera(mouse, camera);



const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);



const intersection = new THREE.Vector3();



raycaster.ray.intersectPlane(plane, intersection);







const axisIndex = draggedObject.userData.axisIndex;



const angle = axisIndex / AXIS_COUNT * Math.PI * 2;



const axisVector = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).normalize();







let projectionDistance = intersection.dot(axisVector);







projectionDistance = Math.max(0.01, Math.min(AXIS_MAX_DISTANCE, projectionDistance));







const currentScore = projectionDistance / DISTANCE_PER_SCORE;



const snappedScore = Math.round(currentScore);



const snappedDistance = snappedScore * DISTANCE_PER_SCORE;







draggedObject.position.copy(axisVector.clone().multiplyScalar(snappedDistance));







updatePolyhedronVisualization();



}







function onMouseUp() {



if (isDragging) {



isDragging = false;







const centerIndex = draggedObject.userData.axisIndex;



const centerDistance = draggedObject.position.length();







currentAxisDistances[centerIndex] = centerDistance;







if (isPhaseTwo) {



assimilateDistances(centerIndex);



} else {



updatePolyhedronVisualization();



}







draggedObject = null;



renderer.domElement.style.cursor = 'pointer';



}



}







function assimilateDistances(centerIndex) {



const centerScore = currentAxisDistances[centerIndex] / DISTANCE_PER_SCORE;







const prevIndex = (centerIndex - 1 + AXIS_COUNT) % AXIS_COUNT;



const nextIndex = (centerIndex + 1) % AXIS_COUNT;







[prevIndex, nextIndex].forEach(index => {



const currentDistance = currentAxisDistances[index];



const currentScore = currentDistance / DISTANCE_PER_SCORE;







const difference = centerScore - currentScore;







let newScore = currentScore + (difference * ASSIMILATION_FACTOR);







newScore = Math.max(0, Math.min(SCORE_MAX, Math.round(newScore)));







const newDistance = newScore * DISTANCE_PER_SCORE;



currentAxisDistances[index] = newDistance;







const angle = index / AXIS_COUNT * Math.PI * 2;



const axisVector = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).normalize();







draggablePoints[index].position.copy(axisVector.multiplyScalar(newDistance));



});







updatePolyhedronVisualization();



}











// --- 5. UI 및 단계 전환 로직 ---







function updateAxisLabels() {



axisLabelsContainer.innerHTML = '';







draggablePoints.forEach((point, index) => {



let currentOffset = AXIS_LABEL_OFFSET;







if (index === 0 || index === 3) {



if (isPhaseTwo) {



currentOffset = 1.7;



} else {



currentOffset = 1.0;



}



}







const angle = index / AXIS_COUNT * Math.PI * 2;



const fixedDistance = AXIS_MAX_DISTANCE + currentOffset;







const fixedVector = new THREE.Vector3(Math.cos(angle) * fixedDistance,



Math.sin(angle) * fixedDistance, 0);







const vector = fixedVector.clone();



vector.project(camera);







const x = (vector.x * 0.5 + 0.5) * window.innerWidth;



const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;







const label = document.createElement('div');



label.className = 'axis-label';







const score = Math.round(point.position.length() / DISTANCE_PER_SCORE);



label.textContent = `${currentAxesNames[index]} (${score}점)`;







label.style.left = `${x}px`;



label.style.top = `${y}px`;







axisLabelsContainer.appendChild(label);



});



}







function calculateDeviation() {



const scores = draggablePoints.map(p => Math.round(p.position.length() / DISTANCE_PER_SCORE));



const mean = scores.reduce((sum, score) => sum + score, 0) / AXIS_COUNT;



const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / AXIS_COUNT;



return Math.sqrt(variance);



}







function analyzeGraphAndGenerateMessage() {



const deviation = calculateDeviation();



const scores = draggablePoints.map((p, index) => ({



name: currentAxesNames[index],



score: Math.round(p.position.length() / DISTANCE_PER_SCORE)



}));







let maxScore = scores.reduce((max, s) => (s.score > max.score ? s : max), { score: -1 });



let minScore = scores.reduce((min, s) => (s.score < min.score ? s : min), { score: 11 });







let message = { title: "분석 결과", body: "" };







if (deviation > 3.0) {



message.title = `당신은 불안정한 그래프를 가지고 있네요.`;



message.body = `당신은 ${maxScore.name} (${maxScore.score}점) 에 대한 압박이 강한 반면,<br> ${minScore.name} (${minScore.score}점) 이 매우 취약하여 불안정합니다.<br> 동글동글한 사람이 될 수 있도록 도와드릴게요!`;



} else if (deviation <= 1.0) {



message.title = `축하합니다! 당신은 안정적입니다.`;



message.body = `당신은 이미 여러 분야의 능력을 고르게 갖추고 있습니다.<br> 이제 원의 크기 자체를 키워봅시다!<br> 다음 단계에서는 더욱 더 동글동글한 사람이 되어봐요.`;



} else {



message.title = `불균형을 인정한 용감한 사람이군요!`;



message.body = `당신은 ${minScore.name} (${minScore.score}점) 을 가장 고민하고 있네요.<br> 이 고민을 외면하지 마세요.<br> 동글동글한 사람이 될 수 있는 방법을 알려드릴게요!`;



}







return message;



}











function showValidationMessage(title, body) {



const overlay = document.createElement('div');



overlay.id = 'validation-message-overlay';



overlay.className = 'phase-message-overlay';







overlay.style.zIndex = '150';



overlay.style.pointerEvents = 'auto';







overlay.innerHTML = `



<h2>${title}</h2>



<p>${body}</p>



`;



document.body.appendChild(overlay);







nextStepButton.style.display = 'block';



nextStepButton.textContent = '그래프로 돌아가서 수정하기';



nextStepButton.onclick = returnToPhase2Graph;



}











function returnToPhase2Graph() {



const overlay = document.getElementById('validation-message-overlay');



if (overlay) document.body.removeChild(overlay);







// 그래프를 다시 보이게 함



toggleVisualization(true);







nextStepButton.style.display = 'block';



nextStepButton.textContent = "나의 동글동글 완성하기!";



nextStepButton.onclick = completeCircle;



}







// 💡 새로운 함수: 원 완성 성공 후 웹캠 시작 안내 메시지



function showCompletionSuccess() {



toggleVisualization(false);







// 1. 메시지 오버레이 생성 및 표시 (버튼 제외)



const overlay = document.createElement('div');



overlay.id = 'success-message-overlay';



overlay.className = 'phase-message-overlay';







overlay.style.zIndex = '150';



overlay.style.pointerEvents = 'auto';







overlay.innerHTML = `



<h2> 동글동글 완성!</h2>



<p>축하합니다! 모든 성장 축을 완벽하게 고르게 갖추셨습니다.</p>



<p>이제 당신의 동글동글한 얼굴을 담아 완성할 차례입니다.</p>



`;



document.body.appendChild(overlay);





// 2. 전역 nextStepButton을 다시 표시하고 텍스트/이벤트 변경



nextStepButton.style.display = 'block';



nextStepButton.textContent = "동글동글한 얼굴 담으러 가기!";





// 3. 버튼 클릭 시 오버레이 제거 및 웹캠 시작 이벤트 연결



nextStepButton.onclick = function() {



const currentOverlay = document.getElementById('success-message-overlay');



if (currentOverlay) document.body.removeChild(currentOverlay);



startWebcam(); // 웹캠 시작



};



}











function goToPhase2() {



const analysis = analyzeGraphAndGenerateMessage();







toggleVisualization(false);







const overlay = document.createElement('div');



overlay.id = 'analysis-message-overlay';



overlay.className = 'phase-message-overlay';



overlay.innerHTML = `



<h2>${analysis.title}</h2>



<p>${analysis.body}</p>



`;



document.body.appendChild(overlay);







nextStepButton.style.display = 'block';



nextStepButton.textContent = "성장 가능성 확인하기";



nextStepButton.onclick = startPhase2;



}







function startPhase2() {



isPhaseTwo = true;



currentAxesNames = growthAxes;







const overlay = document.getElementById('analysis-message-overlay');



if (overlay) document.body.removeChild(overlay);







createDraggablePolyhedron();



toggleVisualization(true);







nextStepButton.style.display = 'block';



nextStepButton.textContent = "나의 동글동글 완성하기!";



nextStepButton.onclick = completeCircle;



}







// -------------------------------------------------------------------------



// ❗❗❗ completeCircle 함수 ❗❗❗



// -------------------------------------------------------------------------



function completeCircle() {



toggleVisualization(false);







const deviation = calculateDeviation();







nextStepButton.style.display = 'none';







if (deviation > ROUNDNESS_THRESHOLD) {



showValidationMessage(



"⚠️ 완성 실패!",



`6가지 성장 축이 아직 고르게 갖춰지지 않았습니다. 모든 축을 동일한 크기(예: 모두 10점)로 만들어서 완벽하게 동글동글을 완성해주세요! (현재 편차: ${deviation.toFixed(2)})`



);



} else {



showCompletionSuccess();



}



}



// -------------------------------------------------------------------------







// 💡 육각형으로 마스킹하는 캔버스 생성 함수 (이미지 엘리먼트를 받음)



function createHexagonMaskCanvas(imgElement) {



const canvas = document.createElement('canvas');



canvas.width = imgElement.width;



canvas.height = imgElement.height;



const ctx = canvas.getContext('2d', { alpha: true });





const centerX = canvas.width / 2;



const centerY = canvas.height / 2;



const size = canvas.width / 2;







ctx.clearRect(0, 0, canvas.width, canvas.height);







// 육각형 클리핑 경로 설정



ctx.beginPath();



for (let i = 0; i < AXIS_COUNT; i++) {



const angle = Math.PI / 3 * i;



ctx.lineTo(centerX + size * Math.cos(angle), centerY + size * Math.sin(angle));



}



ctx.closePath();







ctx.clip();







// 원본 이미지를 마스크 내부에 그립니다.



ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);







return new THREE.CanvasTexture(canvas);



}







// 💡 원으로 마스킹하는 캔버스 생성 함수 (이미지 엘리먼트를 받음)



function createCircleMaskCanvas(imgElement) {



const canvas = document.createElement('canvas');



canvas.width = imgElement.width;



canvas.height = imgElement.height;



const ctx = canvas.getContext('2d', { alpha: true });





const centerX = canvas.width / 2;



const centerY = canvas.height / 2;



const radius = canvas.width / 2;







ctx.clearRect(0, 0, canvas.width, canvas.height);







// 원 클리핑 경로 설정



ctx.beginPath();



ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);



ctx.closePath();







ctx.clip();







// 원본 이미지를 마스크 내부에 그립니다.



ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);







return new THREE.CanvasTexture(canvas);



}







// 💡 3초 딜레이 후 육각형 -> 원으로 즉시 전환하는 함수



function transitionHexagonToCircle(plane, loadedImageElement) {



const START_Y = 1.0;



const FLASH_OFFSET = 0.3; // '뿅' 효과를 위한 짧은 이동 거리







// 1. 초기: 육각형 마스크 적용 (이미지 로딩 완료 시점에 실행됨)



const hexagonTexture = createHexagonMaskCanvas(loadedImageElement);



plane.material.map = hexagonTexture;



plane.material.map.minFilter = THREE.LinearFilter;



plane.material.map.needsUpdate = true;



plane.position.y = START_Y;





// 초기 렌더링 강제 실행 (육각형 이미지를 즉시 표시)



renderer.render(scene, camera);







// 2. 3초 후 전환 실행



setTimeout(() => {



// --- 2-1. '뿅' 시각 효과 (짧은 깜빡임) ---



plane.position.y = START_Y + FLASH_OFFSET; // 순간적으로 위로 이동



renderer.render(scene, camera); // 위치 이동 즉시 렌더링







// --- 2-2. 원 마스크로 즉시 전환 ---



const circleTexture = createCircleMaskCanvas(loadedImageElement);



plane.material.map = circleTexture;



plane.material.map.minFilter = THREE.LinearFilter;



plane.material.map.needsUpdate = true;





renderer.render(scene, camera); // 텍스처 변경 즉시 렌더링





// 2-3. 깜빡임 복귀



setTimeout(() => {



plane.position.y = START_Y; // 원래 위치로 복귀



renderer.render(scene, camera); // 복귀 즉시 렌더링



}, 100);







}, TRANSITION_DELAY); // 3초 대기



}











// 💡 캡처된 이미지를 텍스처로 사용하여 최종 평면을 만듭니다.



function createFinalSphere(imageUrl) {





// 1. 기존의 모든 3D 요소를 제거하는 대신 숨깁니다.



allGridObjects.forEach(obj => obj.visible = false);



draggablePoints.forEach(point => point.visible = false);



if (lineObject) lineObject.visible = false;



if (filledMesh) filledMesh.visible = false;





// 모든 UI 오버레이 숨기기



const overlays = document.querySelectorAll('.phase-message-overlay');



overlays.forEach(overlay => {



if (overlay.id !== 'webcam-overlay') {



document.body.removeChild(overlay);



}



});







// ★★★ 문제 해결 핵심: Image 객체를 사용하여 텍스처 로딩 완료를 보장합니다. ★★★



const img = new Image();



img.crossOrigin = 'Anonymous'; // CORS 문제를 방지 (필요시)



img.onload = function() {



// 3. 평면(Plane) 생성 및 장면에 추가



const planeSize = 7.5; // 최종 이미지 크기를 7.5로 대폭 확대



const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);







const material = new THREE.MeshBasicMaterial({



map: new THREE.Texture(img), // 초기 맵핑



side: THREE.FrontSide,



transparent: true



});







finalImagePlane = new THREE.Mesh(planeGeometry, material); // 전역 변수에 할당





// 카메라 위치를 평면에 맞춰 조정



camera.position.set(0, 0, 8);



finalImagePlane.rotation.set(0, 0, 0);



finalImagePlane.position.set(0, 1.0, 0); // 최종 위치에 고정







scene.add(finalImagePlane);





// 초기 텍스처 업데이트 및 렌더링



finalImagePlane.material.map.needsUpdate = true;







// 육각형 -> 원으로 3초 후 전환 시작



transitionHexagonToCircle(finalImagePlane, img);



};



img.src = imageUrl;



// *************************************************************************











// 💡 최종 평면 이미지 표시 후, 프로젝트 종료 버튼 안내



nextStepButton.style.display = 'block';



nextStepButton.textContent = "프로젝트 종료하기";



nextStepButton.onclick = function() {



// 프로젝트 종료 시에만 모든 요소를 제거하고 새로고침합니다.



allGridObjects.forEach(obj => scene.remove(obj));



draggablePoints.forEach(point => scene.remove(point));



if (lineObject) scene.remove(lineObject);



if (filledMesh) scene.remove(filledMesh);



if (finalImagePlane) scene.remove(finalImagePlane);





alert("프로젝트가 성공적으로 종료되었습니다. 당신의 동글동글이 완성되었습니다!");



location.reload();



};



}











// 💡 육각형으로 웹캠 영상을 그리는 헬퍼 함수



function drawHexagonClip(context, x, y, size) {



context.beginPath();



for (let i = 0; i < 6; i++) {



const angle = Math.PI / 3 * i;



context.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));



}



context.closePath();



}







// 💡 웹캠 시작 함수 (육각형 프레임 표시 및 실시간 영상)



async function startWebcam() {



nextStepButton.style.display = 'none';





// 💡 웹캠 오버레이를 강제로 표시하고 z-index를 높입니다.



if (webcamOverlay) {



webcamOverlay.style.display = 'flex';



webcamOverlay.style.zIndex = '1000';



} else {



alert("웹캠 오버레이 DOM 요소를 찾을 수 없습니다. index.html 파일의 구조를 확인해주세요.");



return;



}







captureButton.style.display = 'block';



retakeButton.style.display = 'none';







// 캔버스 크기 변수 450으로 유지 (웹캠 미리보기 크기 유지)



const canvasSize = 450;



displayCanvas.width = canvasSize;



displayCanvas.height = canvasSize;



const displayCtx = displayCanvas.getContext('2d');





displayCtx.fillStyle = '#333';



displayCtx.fillRect(0, 0, canvasSize, canvasSize);







// 카메라 좌우 반전 강제 비활성화



webcamVideo.style.transform = 'scaleX(1)';



displayCanvas.style.transform = 'scaleX(1)';







try {



// ❗❗❗ 웹캠 접근 시도 ❗❗❗



videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });



webcamVideo.srcObject = videoStream;







webcamVideo.onloadedmetadata = () => {



webcamVideo.play();







const drawWebcamToHexagon = () => {



if (webcamVideo.paused || webcamVideo.ended) return;







displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);







// 육각형 클리핑 영역 설정



displayCtx.save();



drawHexagonClip(displayCtx, displayCanvas.width / 2, displayCanvas.height / 2, canvasSize / 2);



displayCtx.clip();







// 크롭 및 채우기 로직



const videoRatio = webcamVideo.videoWidth / webcamVideo.videoHeight;



const canvasRatio = displayCanvas.width / displayCanvas.height;







let sx, sy, sWidth, sHeight;





if (videoRatio > canvasRatio) {



sHeight = webcamVideo.videoHeight;



sWidth = sHeight * canvasRatio;



sx = (webcamVideo.videoWidth - sWidth) / 2;



sy = 0;



} else {



sWidth = webcamVideo.videoWidth;



sHeight = sWidth / canvasRatio;



sx = 0;



sy = (webcamVideo.videoHeight - sHeight) / 2;



}







// 캔버스에 그리기 (원본 방향, 반전 없음)



displayCtx.drawImage(webcamVideo, sx, sy, sWidth, sHeight, 0, 0, displayCanvas.width, displayCanvas.height);







displayCtx.restore();







requestAnimationFrame(drawWebcamToHexagon);



};



drawWebcamToHexagon();



};







} catch (err) {



console.error("웹캠 접근 오류:", err);



webcamOverlay.style.display = 'none';





// ❗❗❗ 오류 경고 강화 ❗❗❗



alert("🚨 카메라 접근 실패! 🚨\n브라우저 권한을 허용했는지 확인하거나, 웹 서버(HTTPS)를 사용하고 있는지 확인하십시오. \n오류 메시지: " + err.name);





// 오류 발생 시 복구



nextStepButton.style.display = 'block';



nextStepButton.textContent = "돌아가기";



nextStepButton.onclick = function() {



location.reload();



};



}



}







// 💡 캡처 스냅샷 함수 (육각형 클리핑 적용)



function captureSnapshot() {



if (!videoStream) return;







webcamCanvas.width = displayCanvas.width;



webcamCanvas.height = displayCanvas.width; // 캡처 캔버스도 정사각형으로 유지



const context = webcamCanvas.getContext('2d', { alpha: true });







context.clearRect(0, 0, webcamCanvas.width, webcamCanvas.height);







// 육각형 클리핑 영역 설정



context.save();



drawHexagonClip(context, webcamCanvas.width / 2, webcamCanvas.height / 2, webcamCanvas.width / 2);



context.clip();







// 캔버스에 이미지 그리기 (반전 로직 없음)





// 크롭 및 채우기 로직 (실시간 캔버스의 비율과 동일하게)



const videoRatio = webcamVideo.videoWidth / webcamVideo.videoHeight;



const canvasRatio = webcamCanvas.width / webcamCanvas.height;





let sx, sy, sWidth, sHeight;





if (videoRatio > canvasRatio) {



sHeight = webcamVideo.videoHeight;



sWidth = sHeight * canvasRatio;



sx = (webcamVideo.videoWidth - sWidth) / 2;



sy = 0;



} else {



sWidth = webcamVideo.videoWidth;



sHeight = sWidth / canvasRatio;



sx = 0;



sy = (webcamVideo.videoHeight - sHeight) / 2;



}





// 캔버스에 그리기 (원본 방향)



context.drawImage(webcamVideo, sx, sy, sWidth, sHeight, 0, 0, webcamCanvas.width, webcamCanvas.height);







context.restore();





stopWebcam();





// 캡처 후 UI 변경



displayCanvas.style.display = 'none';



webcamOverlay.style.display = 'none'; // 캡처 후 오버레이 닫기







captureButton.style.display = 'none';



retakeButton.style.display = 'block';







const imageUrl = webcamCanvas.toDataURL('image/png');





createFinalSphere(imageUrl);



}











function stopWebcam() {



if (videoStream) {



videoStream.getTracks().forEach(track => track.stop());



videoStream = null;



}



}











// --- 6. 애니메이션 및 보조 함수 (이전과 동일) ---







function onWindowResize() {



camera.aspect = window.innerWidth / window.innerHeight;



camera.updateProjectionMatrix();



renderer.setSize(window.innerWidth, window.innerHeight);



}







function animate() {



requestAnimationFrame(animate);



updateAxisLabels();



renderer.render(scene, camera);



}











// --- 7. 프로젝트 초기화 및 시작 (이전과 동일) ---







function initializeProject() {



createBackgroundPattern(); // 배경 패턴 추가



setupDomReferences();



initThreeJS();



}







// 스크립트 실행 시, 초기화 함수를 호출



initializeProject();