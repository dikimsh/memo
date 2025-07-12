class VoiceMemoApp {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.currentTranscript = '';
        this.finalTranscript = '';
        this.memos = [];
        this.recordingTimer = null;
        this.maxRecordingTime = 30000; // 30초
        this.hasSaved = false; // 저장 완료 플래그
        
        this.initElements();
        this.initSpeechRecognition();
        this.initEventListeners();
        this.loadMemos();
    }
    
    initElements() {
        this.recordButton = document.getElementById('recordButton');
        this.speechText = document.getElementById('speechText');
        this.memoItems = document.getElementById('memoItems');
        this.memoModal = document.getElementById('memoModal');
        this.memoTitle = document.getElementById('memoTitle');
        this.memoContent = document.getElementById('memoContent');
        this.closeModal = document.getElementById('closeModal');
    }
    
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false; // 연속 인식 비활성화로 중복 방지
        this.recognition.interimResults = true;
        this.recognition.lang = 'ko-KR';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.recordButton.classList.add('recording');
            this.speechText.classList.add('recording');
            this.speechText.textContent = '음성을 인식하고 있습니다...';
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            // 모든 결과를 처리하여 최종 결과와 임시 결과 분리
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // 최종 결과가 있으면 전체 교체 (중복 방지)
            if (finalTranscript) {
                this.finalTranscript = finalTranscript;
                console.log('최종 결과 업데이트:', finalTranscript);
            }
            
            // 화면에는 최종 결과 + 현재 임시 결과 표시
            this.speechText.textContent = this.finalTranscript + interimTranscript;
        };
        
        this.recognition.onend = () => {
            console.log('음성인식 종료 이벤트 발생');
            
            // 음성인식 종료 시 항상 녹음 상태 해제
            this.isRecording = false;
            this.recordButton.classList.remove('recording');
            this.speechText.classList.remove('recording');
            
            // 최종 결과가 있고 아직 저장하지 않았으면 메모 저장
            if (this.finalTranscript.trim() && !this.hasSaved) {
                console.log('메모 저장 시도:', this.finalTranscript.trim());
                this.saveMemo(this.finalTranscript.trim());
                this.hasSaved = true; // 저장 완료 표시
            } else {
                console.log('저장 조건 미충족 - 텍스트:', this.finalTranscript.trim(), '저장완료:', this.hasSaved);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('음성 인식 오류:', event.error);
            this.isRecording = false;
            this.recordButton.classList.remove('recording');
            this.speechText.classList.remove('recording');
            this.speechText.textContent = '음성 인식 중 오류가 발생했습니다.';
        };
    }
    
    initEventListeners() {
        // 녹음 버튼 이벤트 (마우스)
        this.recordButton.addEventListener('mousedown', () => {
            this.startRecording();
        });
        
        this.recordButton.addEventListener('mouseup', () => {
            this.stopRecording();
        });
        
        this.recordButton.addEventListener('mouseleave', () => {
            if (this.isRecording) {
                this.stopRecording();
            }
        });
        
        // 녹음 버튼 이벤트 (터치)
        this.recordButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        
        this.recordButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
        
        // 모달 이벤트
        this.closeModal.addEventListener('click', () => {
            this.memoModal.style.display = 'none';
        });
        
        this.memoModal.addEventListener('click', (e) => {
            if (e.target === this.memoModal) {
                this.memoModal.style.display = 'none';
            }
        });
    }
    
    startRecording() {
        if (!this.recognition || this.isRecording) return;
        
        console.log('음성인식 시작');
        this.currentTranscript = '';
        this.finalTranscript = '';
        this.hasSaved = false; // 저장 플래그 초기화
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('음성인식 시작 오류:', error);
        }
        
        // 30초 후 자동 종료 타이머 설정
        this.recordingTimer = setTimeout(() => {
            console.log('30초 타이머 만료로 자동 종료');
            this.stopRecording();
        }, this.maxRecordingTime);
    }
    
    stopRecording() {
        if (!this.recognition) return;
        
        console.log('음성인식 중지 요청');
        
        // 타이머 정리
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
            console.log('타이머 정리 완료');
        }
        
        // 음성인식 중지
        if (this.isRecording) {
            try {
                this.recognition.stop();
                console.log('음성인식 중지 명령 전송');
            } catch (error) {
                console.error('음성인식 중지 오류:', error);
                // 오류 발생 시에도 저장 처리
                this.handleRecordingEnd();
            }
        }
    }
    
    // 녹음 종료 처리 함수
    handleRecordingEnd() {
        console.log('handleRecordingEnd 호출');
        // 최종 결과가 있고 아직 저장하지 않았으면 메모 저장
        if (this.finalTranscript.trim() && !this.hasSaved) {
            console.log('handleRecordingEnd에서 메모 저장:', this.finalTranscript.trim());
            this.saveMemo(this.finalTranscript.trim());
            this.hasSaved = true; // 저장 완료 표시
        }
    }
    
    saveMemo(text) {
        // 빈 텍스트 체크
        if (!text || !text.trim()) {
            console.log('빈 텍스트는 저장하지 않습니다.');
            return;
        }
        
        // 중복 체크: 최근 저장된 메모와 정확히 일치하는지 확인
        if (this.isExactDuplicate(text)) {
            console.log('동일한 메모가 이미 존재합니다. 저장하지 않습니다.');
            this.speechText.textContent = '동일한 메모가 이미 존재합니다.';
            setTimeout(() => {
                this.speechText.textContent = '음성을 인식하면 여기에 표시됩니다...';
            }, 3000);
            return;
        }
        
        // 유사도 체크: 최근 3개 메모와 유사도 비교 (80% 이상 유사시 저장 거부)
        if (this.isDuplicateMemo(text)) {
            console.log('유사한 메모가 이미 존재합니다. 저장하지 않습니다.');
            this.speechText.textContent = '유사한 메모가 이미 존재합니다. (80% 이상 유사)';
            setTimeout(() => {
                this.speechText.textContent = '음성을 인식하면 여기에 표시됩니다...';
            }, 3000);
            return;
        }
        
        const now = new Date();
        const filename = this.formatDate(now);
        
        const memo = {
            id: Date.now().toString(),
            filename: filename,
            content: text,
            timestamp: now.toISOString(),
            date: now.toLocaleDateString('ko-KR'),
            time: now.toLocaleTimeString('ko-KR', { hour12: false })
        };
        
        this.memos.unshift(memo);
        this.saveMemoToStorage();
        this.renderMemos();
        
        console.log('메모 저장 완료:', text.substring(0, 30) + '...');
        this.speechText.textContent = '메모가 저장되었습니다!';
        setTimeout(() => {
            this.speechText.textContent = '음성을 인식하면 여기에 표시됩니다...';
        }, 2000);
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}_${hours}-${minutes}.txt`;
    }
    
    saveMemoToStorage() {
        localStorage.setItem('voiceMemos', JSON.stringify(this.memos));
    }
    
    loadMemos() {
        const saved = localStorage.getItem('voiceMemos');
        if (saved) {
            this.memos = JSON.parse(saved);
        }
        this.renderMemos();
    }
    
    renderMemos() {
        this.memoItems.innerHTML = '';
        
        if (this.memos.length === 0) {
            this.memoItems.innerHTML = `
                <div class="empty-state">
                    <p>저장된 메모가 없습니다.</p>
                    <p>아래 버튼을 눌러 음성 메모를 만들어보세요!</p>
                </div>
            `;
            return;
        }
        
        this.memos.forEach(memo => {
            const memoElement = document.createElement('div');
            memoElement.className = 'memo-item';
            memoElement.innerHTML = `
                <div class="memo-info" onclick="app.showMemo('${memo.id}')">
                    <div class="memo-title">${memo.filename}</div>
                    <div class="memo-date">${memo.date} ${memo.time}</div>
                    <div class="memo-preview">${memo.content.substring(0, 50)}${memo.content.length > 50 ? '...' : ''}</div>
                </div>
                <button class="delete-button" onclick="app.deleteMemo('${memo.id}')">삭제</button>
            `;
            this.memoItems.appendChild(memoElement);
        });
    }
    
    showMemo(id) {
        const memo = this.memos.find(m => m.id === id);
        if (!memo) return;
        
        this.memoTitle.textContent = memo.filename;
        this.memoContent.textContent = memo.content;
        this.memoModal.style.display = 'block';
    }
    
    deleteMemo(id) {
        if (confirm('이 메모를 삭제하시겠습니까?')) {
            this.memos = this.memos.filter(m => m.id !== id);
            this.saveMemoToStorage();
            this.renderMemos();
        }
    }
    
    // 유사도 계산 함수
    calculateSimilarity(text1, text2) {
        // 텍스트 전처리: 공백 제거, 소문자 변환
        const clean1 = text1.replace(/\s+/g, '').toLowerCase();
        const clean2 = text2.replace(/\s+/g, '').toLowerCase();
        
        if (clean1.length === 0 || clean2.length === 0) {
            return 0;
        }
        
        // 레벤슈타인 거리 계산
        const matrix = [];
        for (let i = 0; i <= clean2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= clean1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= clean2.length; i++) {
            for (let j = 1; j <= clean1.length; j++) {
                if (clean2.charAt(i - 1) === clean1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        const distance = matrix[clean2.length][clean1.length];
        const maxLength = Math.max(clean1.length, clean2.length);
        
        // 유사도 계산 (0~1 사이 값)
        return 1 - (distance / maxLength);
    }
    
    // 정확한 중복 체크 함수
    isExactDuplicate(newText) {
        // 최근 저장된 메모와 정확히 일치하는지 확인
        if (this.memos.length > 0) {
            const lastMemo = this.memos[0];
            const cleanNew = newText.trim().toLowerCase();
            const cleanLast = lastMemo.content.trim().toLowerCase();
            
            if (cleanNew === cleanLast) {
                return true;
            }
        }
        return false;
    }
    
    // 중복 메모 체크 함수
    isDuplicateMemo(newText) {
        // 최근 3개 메모와 비교
        const recentMemos = this.memos.slice(0, 3);
        
        for (const memo of recentMemos) {
            const similarity = this.calculateSimilarity(newText, memo.content);
            console.log(`유사도: ${(similarity * 100).toFixed(1)}% - "${memo.content.substring(0, 20)}..."`);
            
            // 80% 이상 유사하면 중복으로 판단
            if (similarity >= 0.8) {
                return true;
            }
        }
        
        return false;
    }
}

// 앱 초기화
const app = new VoiceMemoApp();

// 전역 함수로 노출 (HTML onclick에서 사용)
window.app = app; 