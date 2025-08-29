import { TroubleshootingQA } from "@/components/docs/Troubleshooting";

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
      { href: "/documentation/software/gameSelection#tips-secret-admin-panel", label: "Hidden Admin Panel" }
    ],
    section: "admin-panel-actions-guidance",
    tags: ["freeze","sensors","abnormal","game-engine","game-selection","restart","ethernet","escalation"],
    notes:
      "When logging for devs, capture: timestamp, room, game + variant, number of players, what was on screen, what sensors failed, and whether a prior session had just ended. If repeated within a shift, request a temporary disable of the affected game."
  },

  {
    id: "display-swap-01",
    question: "Scorecard and Room Identifier are on the wrong monitors. How do I swap them?",
    answer:
      "Use the swap action in the Game Selection admin. Open [[Hidden Admin Panel]] and press “Swap Displays”. If the issue persists, verify the HDMI splitter power and cabling, make sure both monitors are on the correct inputs, and re-seat HDMI. As a last resort, restart the PC.",
    relatedPages: [
      "/documentation/software/gameSelection",
      "/documentation/hardware/displays",
      "/documentation/hardware/room-pc"
    ],
    links: [
      { href: "/documentation/software/gameSelection#tips-secret-admin-panel", label: "Hidden Admin Panel" },
      { href: "/documentation/hardware/displays", label: "Displays & Splitter" },
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" }
    ],
    tags: ["display","scorecard","identifier","splitter","hdmi","admin"],
    notes: "If swapping frequently, note room and time; devs can check EDID/graphics config."
  },

  {
    id: "scanner-nfc-01",
    question: "The wristband scanner is not reading bands. What should I try?",
    answer:
      "Check that no other scan is already active in POS or Registration. Re-seat the USB cable or hub, then try a test scan on POS. If the scanner still doesn’t read, restart Game Selection from [[Hidden Admin Panel]] or reboot the Room PC. If it works in POS but not in Game Selection, escalate to devs with time and room.",
    relatedPages: [
      "/documentation/hardware/wristband-scanner",
      "/documentation/software/pos",
      "/documentation/software/registration",
      "/documentation/hardware/room-pc",
      "/documentation/software/gameSelection"
    ],
    links: [
      { href: "/documentation/hardware/wristband-scanner", label: "Wristband Scanner" },
      { href: "/documentation/software/pos", label: "POS" },
      { href: "/documentation/software/registration", label: "Registration" },
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" },
      { href: "/documentation/software/gameSelection#tips-secret-admin-panel", label: "Hidden Admin Panel" }
    ],
    tags: ["scanner","nfc","usb","pos","registration","game-selection"],
    notes: "USB hubs sometimes brown-out. Try a different port or hub if available."
  },

  {
    id: "doorlock-01",
    question: "Door lock is not unlocking/locking as expected. How do I fix it?",
    answer:
      "If a game is stuck running, stopping it can release the lock. Open [[Hidden Admin Panel]] and press “Stop Game”. Check the USB relay cable and LED indicator. Confirm lock wiring (NO/NC) matches the room’s setup. If still failing, reboot the Room PC. If hardware is suspected, contact a manager and escalate.",
    relatedPages: [
      "/documentation/hardware/door-lock",
      "/documentation/software/gameSelection",
      "/documentation/software/game-engine",
      "/documentation/hardware/room-pc"
    ],
    links: [
      { href: "/documentation/hardware/door-lock", label: "Door Lock (USB Relay)" },
      { href: "/documentation/software/gameSelection#tips-secret-admin-panel", label: "Hidden Admin Panel" },
      { href: "/documentation/software/game-engine", label: "Game Engine" },
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" }
    ],
    tags: ["door","lock","relay","usb","game-engine","admin"],
    notes: "Note whether the relay LED changes on command; this helps isolate software vs hardware."
  },

  {
    id: "audio-01",
    question: "There is no sound in the room. What should I check?",
    answer:
      "Make sure speakers are powered and connected (USB or 3.5mm). In Windows, verify the correct output device is selected and volume is up. Re-seat cables. If still silent, restart Game Selection via [[Hidden Admin Panel]] or reboot the PC.",
    relatedPages: [
      "/documentation/hardware/speakers",
      "/documentation/hardware/room-pc",
      "/documentation/software/gameSelection"
    ],
    links: [
      { href: "/documentation/hardware/speakers", label: "Speakers" },
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" },
      { href: "/documentation/software/gameSelection#tips-secret-admin-panel", label: "Hidden Admin Panel" }
    ],
    tags: ["audio","speakers","volume","output","usb","3.5mm"],
    notes: "Some monitors can capture HDMI audio; ensure PC output is the room speakers, not a display."
  },

  {
    id: "monitors-01",
    question: "Room Identifier or Scorecard isn’t showing on the monitors.",
    answer:
      "Check the HDMI splitter power and the monitors’ input selections. Use [[Hidden Admin Panel]] → “Swap Displays” to reassign. If still not visible, re-seat HDMI and try Windows display detect after exiting kiosk (admin only).",
    relatedPages: [
      "/documentation/hardware/displays",
      "/documentation/software/gameSelection",
      "/documentation/hardware/room-pc"
    ],
    links: [
      { href: "/documentation/hardware/displays", label: "Displays & Splitter" },
      { href: "/documentation/software/gameSelection#tips-secret-admin-panel", label: "Hidden Admin Panel" },
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" }
    ],
    tags: ["display","scorecard","identifier","hdmi","splitter","inputs"],
    notes: "If a single room repeatedly drops, note exact time; devs can inspect GPU/EDID logs."
  },

  {
    id: "power-01",
    question: "The Room PC won’t power on in the morning.",
    answer:
      "Open the access panel and verify the power cable is firmly connected. Press the side power button. If the PC was powered off at the main switch without shutdown the previous night, it may need a manual start. If still off, contact a manager.",
    relatedPages: ["/documentation/hardware/room-pc"],
    links: [
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" }
    ],
    tags: ["power","boot","room-pc"],
    notes: "PCs are configured to auto-power on when power returns, but manual start may be needed after an improper shutdown."
  },

  {
    id: "autostart-01",
    question: "Game Selection did not start automatically after boot.",
    answer:
      "Log into GameUser if the account chooser is shown. If Game Selection still does not appear, open File Explorer and run C:\\deploy\\watch_dog.bat. If that fails, run C:\\Pixelpulse\\GameSelection\\gameSelection.exe. If this repeats, report the time so devs can check the startup task.",
    relatedPages: [
      "/documentation/hardware/room-pc",
      "/documentation/software/gameSelection"
    ],
    links: [
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" },
      { href: "/documentation/software/gameSelection", label: "Game Selection" }
    ],
    tags: ["autostart","watchdog","exe","gameuser","kiosk"],
    notes: "If you had to use the executable, note it so devs can verify watchdog and scheduled tasks."
  },

  {
    id: "axe-mirror-01",
    question: "Axe Throwing tablet is not mirroring the PC UI.",
    answer:
      "Check the tablet’s connection to the same network as the axe PC. Ensure the pairing or casting app is running on both devices. Restart the tablet app, then restart the axe PC app if needed. If depth camera is required and unavailable, reconnect it and restart the app.",
    relatedPages: [
      "/documentation/software/axe-throwing",
      "/documentation/hardware/axe-throwing"
    ],
    links: [
      { href: "/documentation/software/axe-throwing", label: "Axe Throwing (Software)" },
      { href: "/documentation/hardware/axe-throwing", label: "Axe Throwing (Hardware)" }
    ],
    tags: ["axe","tablet","mirror","casting","camera"],
    notes: "If one lane repeatedly fails, include lane number and time for devs."
  },

  {
    id: "pos-renew-01",
    question: "At POS, should I use Modify or Renew on a wristband?",
    answer:
      "If the wristband is still active, use Modify to add time. If it is expired, use Renew to create a fresh record. If no record is found, register the guest or initialize the band first. The UI shows the correct action after scan.",
    relatedPages: ["/documentation/software/pos"],
    links: [
      { href: "/documentation/software/pos", label: "POS" }
    ],
    tags: ["pos","renew","modify","initialize","record"],
    notes: "Follow the prompts; Renew deactivates the old record and creates a new one."
  },

  {
    id: "registration-sync-01",
    question: "Registration tablet is not syncing or can’t log in.",
    answer:
      "Verify Wi-Fi is connected and the internet is available. Confirm the correct account is used to sign in. If the app appears offline, restart the app and ensure the server is reachable. If still failing, try a different network or contact a manager.",
    relatedPages: [
      "/documentation/software/registration",
      "/documentation/hardware/registration-tablet"
    ],
    links: [
      { href: "/documentation/software/registration", label: "Registration (Android)" },
      { href: "/documentation/hardware/registration-tablet", label: "Registration Tablet" }
    ],
    tags: ["registration","tablet","wifi","login","sync"],
    notes: "If multiple tablets fail simultaneously, note the time; could be a service outage."
  },

  {
    id: "network-link-01",
    question: "Ethernet link is down or devices aren’t connecting.",
    answer:
      "Check that the Ethernet cable is connected at the PC and switch and the link lights are blinking. Try another port or cable. If the Game Engine shows devices offline, restart it via [[Hidden Admin Panel]] → Stop Game, then start a new session. Escalate if persistent.",
    relatedPages: [
      "/documentation/hardware/room-pc",
      "/documentation/hardware/game-devices",
      "/documentation/software/game-engine",
      "/documentation/software/gameSelection"
    ],
    links: [
      { href: "/documentation/hardware/room-pc", label: "Room Touch PC" },
      { href: "/documentation/hardware/game-devices", label: "Game-specific Hardware" },
      { href: "/documentation/software/game-engine", label: "Game Engine" },
      { href: "/documentation/software/gameSelection#tips-secret-admin-panel", label: "Hidden Admin Panel" }
    ],
    tags: ["ethernet","network","link-lights","devices-offline","game-engine"],
    notes: "Document switch port and any link LEDs observed; helpful for diagnosing cabling vs software."
  }
];
