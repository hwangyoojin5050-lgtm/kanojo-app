const STORY_SCENES = {
  prologue: {
    id: "prologue",
    title: "프롤로그: 옆자리의 재회",
    unlockMinMinutes: 0,
    lines: [
      { speaker: "narration", text: "대학교 도서관. 거대한 메탈 기타 케이스를 맨 채 쭈뼛거리는 소꿉친구 '안나'를 우연히 발견했다." },
      { speaker: "player", text: "어? 대박…… 너 안나 맞지?! 야, 이게 얼마 만이야!" },
      { speaker: "anna", text: "……엇? 어…… ○○아? 너도 이 학교였어……?" },
      { speaker: "player", text: "그러니까! 우와, 너 그 뒤로도 계속 음악 하더니 결국 실음과 갔구나? 기타 케이스 진짜 크다." },
      { speaker: "anna", text: "응…… 메탈 전공이라 밴드도 하고 있어. 근데 넌 여전히 목소리 크고 똑같네……." },
    ],
    choices: [
      {
        id: 1,
        text: "그럼 나랑 같이 매일 도서관에서 공부할래? 나 시간 기록 앱 쓰는데!",
        affectionBonus: 20,
        reaction: [
          { speaker: "anna", text: "……같이 공부? 어, 음…… 네가 좋다면, 나야 좋지…… 매일 봐도 되는 거지?" },
          { speaker: "narration", text: "안나의 귀 끝이 살짝 빨개진다." },
        ],
      },
      {
        id: 2,
        text: "메탈? 대박, 나중에 네 공연 나 꼭 불러줘야 한다?",
        affectionBonus: 15,
        reaction: [
          { speaker: "anna", text: "내, 내 음악… 시끄러울 텐데…… 진짜 올 거야? 약속했다? 딴말하기 없기야." },
          { speaker: "narration", text: "안나가 기타 케이스를 꼭 쥔다." },
        ],
      },
      {
        id: 3,
        text: "너 소심한 건 여전하네. 일단 앉아봐, 밀린 얘기 좀 하자.",
        affectionBonus: 12,
        reaction: [
          { speaker: "anna", text: "내가 소심한 게 아니라 네가 너무 기운 넘치는 거야…… 그래도 오랜만에 보니까… 좋다." },
          { speaker: "narration", text: "안나가 소중하게 웃는다." },
        ],
      },
    ],
  },
  event1: {
    id: "event1",
    title: "사건 1. 과거 고등학교 시절 회상",
    unlockMinMinutes: 300,
    lines: [
      { speaker: "system", text: "[시스템] 누적 공부 시간 5시간 달성. 안나의 기억 조각이 해금된다. 화면이 흑백으로 전환된다." },
      { speaker: "anna", text: "고등학교 때의 너는 항상 사람들 틈에서 환하게 웃고 있었어. 사교적이고 친절한 너에 비해, 맨날 헤드폰만 쓰고 구석에 박혀 있던 나." },
      { speaker: "anna", text: "내 거친 메탈 음악을 모두가 이상하게 볼 때, 너만은 멋있다며 내 세상을 궁금해해 줬지. 그날부터였을 거야." },
      { speaker: "anna", text: "난 언제나 네 옆자리를 바랐지만, 한 걸음 다가갈 용기가 없었어. 그런데 대학에서 다시 만난 네가 먼저 내 손을 잡아준 거야…… 이번엔 절대 안 놓칠래." },
    ],
    choices: null,
  },
  event2: {
    id: "event2",
    title: "사건 2. 도서관에서 공부하다 머리에 기대어 졸기",
    unlockMinMinutes: 0,
    unlockAffection: 120,
    requiresCompleted: ["prologue"],
    lines: [
      { speaker: "narration", text: "전공책을 펴놓고 꾸벅꾸벅 졸던 안나의 머리가 플레이어의 어깨 위로 툭 떨어진다." },
      { speaker: "player", text: "안나, 졸려? 밤새 또 밤샘 합주한 거 아니야? ……어라." },
      { speaker: "narration", text: "안나의 머리가 어깨에 닿고, 잠결에 옷자락을 만지작거리며 웅얼거린다." },
    ],
    choices: [
      {
        id: 1,
        text: "(가만히 어깨를 대어주며) \"안 가니까 편하게 자라, 그냥.\"",
        affectionBonus: 35,
        reaction: [
          { speaker: "anna", text: "……음…… 고마워……." },
          { speaker: "narration", text: "잠결에 플레이어의 팔을 꼭 껴안으며 더 깊이 기댄다." },
        ],
      },
      {
        id: 2,
        text: "(장난기가 발동해 뺨을 콕콕 찌른다) \"일어나, 대마왕님. 공부해야지?\"",
        affectionBonus: 10,
        reaction: [
          { speaker: "anna", text: "으응…… 하지 마아……." },
          { speaker: "narration", text: "미간을 찌푸리며 플레이어의 손을 무의식적으로 잡아 내린다." },
        ],
      },
      {
        id: 3,
        text: "(초커와 체인을 보며) \"이러고 다니면서 잘 때는 고양이 같다니까.\"",
        affectionBonus: 18,
        reaction: [
          { speaker: "anna", text: "앗, 미안! 내가 잠결에……! 그, 그리고 나 고양이 안 닮았어……!" },
          { speaker: "narration", text: "번쩍 눈을 뜨며 얼굴이 새빨개진다." },
        ],
      },
    ],
  },
  event3: {
    id: "event3",
    title: "사건 3. 밴드 공연 초대",
    unlockMinMinutes: 0,
    unlockAffection: 280,
    requiresCompleted: ["event2"],
    lines: [
      { speaker: "narration", text: "무대 뒤 대기실, 공연 직전. 잔뜩 긴장해 손을 떨고 있는 안나를 찾아왔다." },
      { speaker: "anna", text: "어, 진짜 왔네……? 자리 꽉 차서 뒤에서 봐야 할지도 몰라. 일부러 시간 내서 와줬는데 미안해……." },
      { speaker: "player", text: "무슨 소리야, 소꿉친구 첫 공연인데 당연히 와야지! 안나, 손 엄청 차가운데? 그렇게 떨려?" },
      { speaker: "anna", text: "그냥…… 다른 사람들은 상관없는데, 네가 보고 있다고 생각하니까 갑자기 손가락이 굳는 것 같아서. ……나 오늘 너만 보고 연주할게. 부끄러우니까 놀리지 마." },
    ],
    choices: [
      {
        id: 1,
        text: "(손을 꼭 잡아주며) \"긴장 풀고 평소대로 해. 무대 밑에서 제일 크게 응원할게.\"",
        affectionBonus: 30,
        reaction: [
          { speaker: "anna", text: "……응. 네 온기가 남아있어서 잘할 수 있을 것 같아. 고마워, ○○아." },
        ],
      },
      {
        id: 2,
        text: "\"기타리스트가 기 죽으면 안 되지! 가라, 안나! 무대 부숴버려!\"",
        affectionBonus: 20,
        reaction: [
          { speaker: "anna", text: "푸흡…… 진짜 너다운 응원이다. 알았어, 오늘 무대 진짜 부숴볼게. 잘 봐." },
        ],
      },
      {
        id: 3,
        text: "\"너만 보고 연주한다니, 그거 고백이야? 기대하고 있을게.\"",
        affectionBonus: 25,
        reaction: [
          { speaker: "anna", text: "고, 고백이라니 무슨……! 아니, 그게 아니라…… 하아, 진짜 몰라!" },
          { speaker: "narration", text: "얼굴이 폭발할 듯 붉어진 채 무대로 도망치듯 나간다." },
        ],
      },
    ],
    postLines: [
      { speaker: "narration", text: "잠시 후 무대 위, 강렬한 메탈 사운드 속에서 눈빛이 돌변해 기타를 치는 안나. 깊은 인상을 받는다." },
    ],
  },
  event4: {
    id: "event4",
    title: "사건 4. 푸른 바다로의 둘만의 여행",
    unlockMinMinutes: 0,
    unlockAffection: 450,
    requiresCompleted: ["event3"],
    lines: [
      { speaker: "narration", text: "여름 방학, 탁 트인 바닷가. 안나는 평소의 펑크룩 대신 편안한 셔츠 차림이다." },
      { speaker: "player", text: "야, 안나! 물 진짜 시원해! 얼른 신발 벗고 들어와 봐!" },
      { speaker: "anna", text: "아…… 응, 잠깐만. 그냥 너 신나서 뛰어다니는 거 보느라." },
    ],
    choices: [
      {
        id: 1,
        text: "(다가가 손을 잡고 이끌며) \"나만 보지 말고 너도 같이 놀자니까? 자, 손 잡아.\"",
        affectionBonus: 30,
        reaction: [
          { speaker: "anna", text: "……나 사실 사람 많고 시끄러워서 바다 별로 안 좋아했거든? 근데 너랑 오니까 되게 좋다. 세상에 그냥 우리 둘밖에 없는 것 같아." },
        ],
      },
      {
        id: 2,
        text: "(바닷물을 살짝 튕기며) \"싱겁게 보지만 말고 얼른 들어와!\"",
        affectionBonus: 18,
        reaction: [
          { speaker: "anna", text: "앗, 차가워! 치…… 너 자꾸 그러면 나도 공격한다?" },
          { speaker: "narration", text: "수줍게 웃으며 조그맛게 물을 튀겨 부딪쳐온다." },
        ],
      },
      {
        id: 3,
        text: "\"내 얼굴에 뭐 묻었어? 왜 그렇게 쳐다봐?\"",
        affectionBonus: 22,
        reaction: [
          { speaker: "anna", text: "응, 예쁨이 묻었어…… 아, 아니! 아무것도 아니야! 나도 들어갈래!" },
        ],
      },
    ],
  },
  event5: {
    id: "event5",
    title: "사건 5. 엔딩 분기점: 치명적인 오해",
    unlockMinMinutes: 0,
    unlockAffection: 600,
    requiresCompleted: ["event4"],
    lines: [
      { speaker: "narration", text: "다른 학과 동기와 다정하게 웃으며 카페로 들어가는 모습을 안나가 멀리서 목격했다. 다음 날, 차가운 눈으로 물어온다." },
      { speaker: "anna", text: "○○아…… 어제 오후에 과 건물 앞에서 만난 사람…… 누구야? 둘이 되게 다정해 보이던데." },
    ],
    choices: [
      {
        id: 1,
        text: "\"아, 어제? 조별 과제 자료 받느라 잠깐 만난 과대표야. 왜, 질투 나?\"",
        endingKey: "happy",
        affectionBonus: 0,
        reaction: [],
      },
      {
        id: 2,
        text: "\"그냥 아는 동기야. 별일 아니니까 신경 쓰지 마.\"",
        endingKey: "yandere",
        affectionBonus: 0,
        reaction: [],
      },
      {
        id: 3,
        text: "\"남의 사생활을 왜 그렇게 캐물어? 좀 당황스럽네.\"",
        endingKey: "yandere",
        affectionBonus: 0,
        reaction: [],
      },
    ],
  },
  ending_happy: {
    id: "ending_happy",
    title: "엔딩 1. 함께 미래를 약속한다",
    unlockMinMinutes: 0,
    isEnding: true,
    lines: [
      { speaker: "anna", text: "미안해…… 내가 요즘 혼자 예민하게 굴었지. 그냥 네가 나 말고 다른 사람이랑 그렇게 웃고 있는 걸 보니까…… 순간 머리가 어떻게 됐었나 봐." },
      { speaker: "player", text: "에휴, 이 바보야. 과제 때문에 자료 좀 받느라 잠깐 만난 거야. 네 옆자리 비워두고 내가 어딜 가냐?" },
      { speaker: "anna", text: "……진짜지? 나 진짜 너 없으면 안 돼, ○○아." },
      { speaker: "player", text: "나도 알아. 그러니까 맨날 네 옆에서 공부 시간 채우고 있었잖아. 앞으로 졸업하고 나서도 계속 같이 있자. 내가 네 전용 관객 해줄게." },
      { speaker: "anna", text: "……응. 약속했다? 나 평생 너만을 위한 곡만 쓸 거야. 내 옆에서 절대 도망치지 마." },
    ],
    choices: null,
  },
  ending_yandere: {
    id: "ending_yandere",
    title: "엔딩 2. 안나가 얀데레가 된다",
    unlockMinMinutes: 0,
    isEnding: true,
    lines: [
      { speaker: "narration", text: "어두운 안나의 자취방." },
      { speaker: "player", text: "안나……? 문은 왜 잠가? 그리고 내 핸드폰은 왜 네가 들고 있어? 돌려줘, 지금 과 동기한테 연락 올 데 있어." },
      { speaker: "anna", text: "그 사람 연락 안 올 거야. 내가 다 차단했거든. 다른 애들 번호도 전부 다." },
      { speaker: "player", text: "너 지금 무슨 소리를 하는 거야……? 장난치지 마, 진짜로." },
      { speaker: "anna", text: "장난 아닌데……? 네가 자꾸 나 말고 딴 데 보니까 내가 살 수가 없잖아. 이 앱 이름이 왜 '너의 옆자리'겠어? 네 옆엔 나만 있어야 하는 거잖아." },
      { speaker: "anna", text: "자, 폰은 신경 쓰지 말고 나랑 있자. 오늘도 같이 시간 기록하는 거지? 영원히 내 옆자리에서." },
    ],
    choices: null,
  },
};

const STORY_ORDER = [
  "prologue",
  "event1",
  "event2",
  "event3",
  "event4",
  "event5",
  "ending_happy",
  "ending_yandere",
];

/** 사건별 연애 탭 메인·프로필 이미지 */
const STORY_VISUALS = {
  prologue: {
    src: "./assets/character.png",
    variant: "character",
    alt: "안나",
  },
  event1: {
    src: "./assets/scene-event1.png",
    variant: "scene",
    alt: "고등학교 교실 회상",
    grayscale: true,
  },
  event2: {
    src: "./assets/scene-event2.png",
    variant: "scene",
    alt: "도서관에서 공부하는 장면",
  },
  event3: {
    src: "./assets/scene-event3.png",
    variant: "scene",
    alt: "밴드 공연 무대",
  },
  event4: {
    src: "./assets/scene-event4.png",
    variant: "scene",
    alt: "푸른 바다 해변",
  },
  event5: {
    src: "./assets/scene-event5.png",
    variant: "scene",
    alt: "오해의 순간, 폭풍우 하늘",
  },
  ending_happy: {
    src: "./assets/scene-ending-happy.png",
    variant: "scene",
    alt: "오해가 풀린 뒤, 벚꽃과 약속",
  },
  ending_yandere: {
    src: "./assets/scene-ending-yandere.png",
    variant: "scene",
    alt: "어두운 방, 얀데레 엔딩",
    dark: true,
  },
};
