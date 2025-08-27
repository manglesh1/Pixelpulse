export interface GameRoomData {
    name: string;
    description: string;
    image: string;
    link: string;
}
export const gameroomData:GameRoomData[] = 
[
    {
        name: "Tile Hunt",
        description: "Pixelpulse is an open-source, web-based platform designed to facilitate live trivia games and interactive quizzes. It offers a user-friendly interface for both hosts and participants, making it easy to create, manage, and join trivia sessions in real-time.",
        image: "/docs/game-selection/room-identifiers/TileHunt.png",
        link: "/documentation/software/gameEngine/Tilehunt"
    },
    {
        name: "Blitz Basket",
        description: "Alliance is a dynamic and engaging quiz game platform that allows users to participate in team-based trivia competitions. Designed for both casual and competitive play, Alliance offers a variety of game modes, including cooperative challenges and head-to-head battles, making it a versatile choice for social gatherings, educational settings, and corporate events.",
        image: "/docs/game-selection/room-identifiers/Basket.png",
        link: "/documentation/software/gameEngine/Bakset"
    },
    {
        name: "CTarget",
        description: "Alliance is a dynamic and engaging quiz game platform that allows users to participate in team-based trivia competitions. Designed for both casual and competitive play, Alliance offers a variety of game modes, including cooperative challenges and head-to-head battles, making it a versatile choice for social gatherings, educational settings, and corporate events.",
        image: "/docs/game-selection/room-identifiers/CTarget.png",
        link: "/documentation/software/gameEngine/CTarget"
    },
    {
        name: "Hexa Quest",
        description: "Alliance is a dynamic and engaging quiz game platform that allows users to participate in team-based trivia competitions. Designed for both casual and competitive play, Alliance offers a variety of game modes, including cooperative challenges and head-to-head battles, making it a versatile choice for social gatherings, educational settings, and corporate events.",
        image: "/docs/game-selection/room-identifiers/HexaQuest.png",
        link: "/documentation/software/gameEngine/HexaQuest"
    },
    {
        name: "Climb",
        description: "Alliance is a dynamic and engaging quiz game platform that allows users to participate in team-based trivia competitions. Designed for both casual and competitive play, Alliance offers a variety of game modes, including cooperative challenges and head-to-head battles, making it a versatile choice for social gatherings, educational settings, and corporate events.",
        image: "/docs/game-selection/room-identifiers/Climb.png",
        link: "/documentation/software/gameEngine/Climb"
    },
    {
        name: "Push Game",
        description: "Alliance is a dynamic and engaging quiz game platform that allows users to participate in team-based trivia competitions. Designed for both casual and competitive play, Alliance offers a variety of game modes, including cooperative challenges and head-to-head battles, making it a versatile choice for social gatherings, educational settings, and corporate events.",
        image: "/docs/game-selection/room-identifiers/PushGame.png",
        link: "/documentation/software/gameEngine/PushGame"
    },
    {
        name: "Recipe",
        description: "Alliance is a dynamic and engaging quiz game platform that allows users to participate in team-based trivia competitions. Designed for both casual and competitive play, Alliance offers a variety of game modes, including cooperative challenges and head-to-head battles, making it a versatile choice for social gatherings, educational settings, and corporate events.",
        image: "/docs/game-selection/room-identifiers/Recipe.png",
        link: "/documentation/software/gameEngine/Recipe"
    },
    {
        name: "Laser Escape",
        description: "Alliance is a dynamic and engaging quiz game platform that allows users to participate in team-based trivia competitions. Designed for both casual and competitive play, Alliance offers a variety of game modes, including cooperative challenges and head-to-head battles, making it a versatile choice for social gatherings, educational settings, and corporate events.",
        image: "/docs/game-selection/room-identifiers/LaserEscape.png",
        link: "/documentation/software/gameEngine/LaserEscape"
    },
]

export interface TroubleshootingQA {
  id: string; 
  question: string; // the staff-facing question
  answer: string; // plain-text with optional [[Label]] or [Label](href)
  relatedPages: string[]; // list of related page names/paths
  links: { href: string; label: string }[]; // multiple links with display text
  section?: string; // optional: anchor/heading id
  tags?: string[]; // optional quick search/filter tags
  notes?: string; // extra hints, escalations, or staff-only notes
}

export const troubleshootingData: TroubleshootingQA[] = [
  {
    id: "sw-freeze-01",
    question:
      "What should I do when the game freezes, sensors stop responding, or the game acts abnormally?",
    answer:
      "This is most often a software issue (Game Engine). First, note the exact time and describe the issue so devs can investigate logs. Then open the [[Hidden Admin Panel]] from the Game Selection screen and press “Stop Game” to terminate the current engine instance. Start a new session to verify. If the issue persists, use “Restart PC” for a clean reboot. If problems continue, check hardware connections—especially the Ethernet cable and link lights (both RX/TX should blink). If you still can’t resolve it, escalate to devs immediately. If it’s resolved but recurs, escalate to have the game temporarily disabled until fixed.",
    relatedPages: [
      "/documentation/software/gameSelection",
      "/documentation/software/game-engine"
    ],
    links: [
      {
        href: "/documentation/software/gameSelection#tips-secret-admin-panel",
        label: "Hidden Admin Panel"
      }
    ],
    section: "admin-panel-actions-guidance",
    tags: [
      "freeze",
      "sensors",
      "abnormal",
      "game-engine",
      "game-selection",
      "restart",
      "ethernet",
      "escalation"
    ],
    notes:
      "When logging for devs, capture: timestamp, room, game + variant, number of players, what was on screen, what sensors failed, and whether a prior session had just ended. If repeated within a shift, request a temporary disable of the affected game."
  }
];
