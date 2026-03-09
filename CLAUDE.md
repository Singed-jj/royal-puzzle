# 탈출! 곰사원 (Bear Office Escape)

Match-3 퍼즐 게임. 곰 사원이 회사에서 탈출하는 스토리 기반 퍼즐.

## 빌드 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # tsc + vite build → dist/
npm run preview  # 빌드 결과 미리보기
npm run test     # vitest 테스트 실행
```

## 기술 스택

- **엔진**: Phaser 3
- **언어**: TypeScript
- **빌드**: Vite 7
- **테스트**: Vitest
- **배포**: Vercel

## 프로젝트 구조

```
src/
├── main.ts          # 엔트리포인트 (Phaser 게임 초기화)
├── config.ts        # 게임 설정
├── data/            # 레벨, 스테이지 데이터
├── game/            # 핵심 게임 로직 (보드, 매칭, 아이템)
├── scenes/          # Phaser 씬 (Boot, Map, Game, Nightmare, Result)
└── ui/              # UI 컴포넌트
public/              # 정적 에셋
```
