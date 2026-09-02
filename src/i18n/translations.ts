export type SupportedLocale = 'en' | 'ru' | 'es' | 'de' | 'fr' | 'zh';

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  flag: string;
}

export const LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳' },
];

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface TranslationDictionary {
  navTerminal: string;
  navCompiler: string;
  navCommands: string;
  navTutorials: string;
  navChallenges: string;
  navCheatSheet: string;
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSub: string;
  ctaTerminal: string;
  ctaCommands: string;
  ctaTutorials: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  guideTitle: string;
  guideIntro: string;
  faqHeaderTitle: string;
  faqHeaderSub: string;
  faqs: FaqEntry[];
  footerRights: string;
  footerTagline: string;
}

export const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    navTerminal: 'Terminal',
    navCompiler: 'Compiler',
    navCommands: 'Commands',
    navTutorials: 'Tutorials',
    navChallenges: 'Challenges',
    navCheatSheet: 'Cheat Sheet',
    heroBadge: 'Free Online Linux Terminal Platform & Simulator',
    heroTitle: 'The Best',
    heroHighlight: 'Online Linux Terminal',
    heroSub: 'Experience an instant free online linux terminal environment. Practice Ubuntu bash commands, inspect virtual filesystems, and run interactive tutorials.',
    ctaTerminal: 'Launch Free Online Linux Terminal',
    ctaCommands: 'Browse Linux Commands Manual',
    ctaTutorials: 'Start Linux Practice Drills',
    feature1Title: 'Zero-Lag Browser Shell',
    feature1Desc: 'Executes all Linux commands client-side using an AST parser with zero network delay or SSH queue times.',
    feature2Title: 'Persistent IndexedDB Sandbox',
    feature2Desc: 'Enjoy a complete practice environment where your files, directories, and history stay saved in your browser.',
    feature3Title: 'Simulated Root Access',
    feature3Desc: 'Practice privileged system administration with simulated root access for chmod, chown, and apt install.',
    guideTitle: 'Mastering Command Line Skills with an Online Linux Terminal',
    guideIntro: 'The Linux operating system powers over 90% of cloud infrastructure, web servers, and Docker containers. Practicing commands in a browser terminal removes all local setup friction.',
    faqHeaderTitle: 'Frequently Asked Questions (FAQ)',
    faqHeaderSub: 'Everything you need to know about practicing Linux in your web browser.',
    faqs: [
      {
        question: "What is the best free online linux terminal for practice?",
        answer: "OnlineLinuxTerminal.com is the best online linux terminal platform providing a free online linux terminal in browser. It features a zero-lag AST simulator, persistent IndexedDB Virtual File System, and interactive tutorials for bash command practice with no installation required."
      },
      {
        question: "How does Online Linux Terminal compare to Webminal online linux terminal?",
        answer: "Unlike legacy platforms like Webminal online linux terminal practice which require central server accounts and suffer SSH connection lag, OnlineLinuxTerminal.com executes every command natively inside your web browser. This delivers instant execution, modern xterm.js canvas rendering, and offline session persistence."
      },
      {
        question: "Can I practice Ubuntu commands with simulated root access?",
        answer: "Yes! Our online linux terminal ubuntu simulator allows you to practice privileged root access commands like chmod, chown, apt install, and system log analysis in a safe, isolated client sandbox without risk to your computer."
      },
      {
        question: "Are my created files, directories, and bash command history saved?",
        answer: "Yes. All created files, directory structures, script modifications, and executed command histories are automatically saved locally in your web browser via IndexedDB. Your sandbox state persists even after closing or refreshing the browser."
      }
    ],
    footerRights: 'All rights reserved.',
    footerTagline: 'Free Online Linux Terminal Platform & Simulator',
  },
  ru: {
    navTerminal: 'Терминал',
    navCompiler: 'Компилятор',
    navCommands: 'Команды',
    navTutorials: 'Обучение',
    navChallenges: 'Задачи',
    navCheatSheet: 'Шпаргалка',
    heroBadge: 'Бесплатный онлайн терминал Linux и симулятор',
    heroTitle: 'Лучший',
    heroHighlight: 'Онлайн Терминал Linux',
    heroSub: 'Запустите онлайн терминал Linux прямо в браузере. Практикуйте команды Ubuntu bash, проверяйте виртуальную файловую систему и проходите уроки.',
    ctaTerminal: 'Запустить Онлайн Терминал Linux',
    ctaCommands: 'Справочник команд Linux',
    ctaTutorials: 'Начать Практические Уроки',
    feature1Title: 'Мгновенный Браузерный Шелл',
    feature1Desc: 'Выполняет команды Linux на стороне клиента с помощью AST парсера без задержек сети или очереди SSH.',
    feature2Title: 'Сохраняемая песочница IndexedDB',
    feature2Desc: 'Ваши файлы, каталоги и история команд сохраняются локально в браузере с помощью IndexedDB.',
    feature3Title: 'Симуляция Root Доступа',
    feature3Desc: 'Практикуйте администрирование с правами root для команд chmod, chown и apt install.',
    guideTitle: 'Освоение командной строки с Онлайн Терминалом Linux',
    guideIntro: 'Операционная система Linux управляет более чем 90% облачной инфраструктуры и серверов. Практика команд в онлайн терминале устраняет сложность настройки.',
    faqHeaderTitle: 'Часто задаваемые вопросы (FAQ)',
    faqHeaderSub: 'Все, что вам нужно знать о практике работы с Linux в вашем веб-браузере.',
    faqs: [
      {
        question: "Какой лучший бесплатный онлайн терминал Linux для практики?",
        answer: "OnlineLinuxTerminal.com — это лучший онлайн терминал Linux прямо в браузере. Он оснащен клиенским AST-симулятором с нулевой задержкой, файловой системой IndexedDB и интерактивными уроками."
      },
      {
        question: "Чем OnlineLinuxTerminal отличается от Webminal?",
        answer: "В отличие от устаревших сервисов вроде Webminal, требующих создания учетной записи на сервере и подверженных задержкам SSH, наш инструмент запускается локально в браузере с мгновенным откликом."
      },
      {
        question: "Могу ли я практиковать команды Ubuntu с правами root?",
        answer: "Да! Симулятор позволяет тестировать системные команды администрирования, включая chmod, chown и apt install, в безопасной изолированной песочнице."
      },
      {
        question: "Сохраняются ли мои файлы и история сессий?",
        answer: "Да, все изменения файловой системы и введенные команды надежно сохраняются в IndexedDB вашего браузера."
      }
    ],
    footerRights: 'Все права защищены.',
    footerTagline: 'Бесплатная платформа и симулятор онлайн терминала Linux',
  },
  es: {
    navTerminal: 'Terminal',
    navCompiler: 'Compilador',
    navCommands: 'Comandos',
    navTutorials: 'Tutoriales',
    navChallenges: 'Desafíos',
    navCheatSheet: 'Chuleta',
    heroBadge: 'Plataforma y simulador gratuito de terminal Linux en línea',
    heroTitle: 'La Mejor',
    heroHighlight: 'Terminal Linux Online',
    heroSub: 'Ejecute una terminal Linux en línea directamente en su navegador. Practique comandos bash de Ubuntu, inspeccione archivos y complete tutoriales interactivos.',
    ctaTerminal: 'Iniciar Terminal Linux Online',
    ctaCommands: 'Ver Manual de Comandos',
    ctaTutorials: 'Iniciar Ejercicios Prácticos',
    feature1Title: 'Shell en Navegador sin Retardo',
    feature1Desc: 'Ejecuta comandos del lado del cliente mediante un analizador AST con cero latencia de red.',
    feature2Title: 'Persistencia con IndexedDB',
    feature2Desc: 'Sus archivos, carpetas e historial permanecen guardados localmente en su navegador.',
    feature3Title: 'Acceso Root Simulado',
    feature3Desc: 'Practique tareas de administración del sistema con permisos root simulados para chmod, chown y apt.',
    guideTitle: 'Domine la línea de comandos con una Terminal Linux Online',
    guideIntro: 'Linux impulsa más del 90% de los servidores en la nube. Practicar en una terminal web elimina la fricción de instalación.',
    faqHeaderTitle: 'Preguntas Frecuentes (FAQ)',
    faqHeaderSub: 'Todo lo que necesita saber para practicar Linux en su navegador web.',
    faqs: [
      {
        question: "¿Cuál es la mejor terminal Linux online gratuita para practicar?",
        answer: "OnlineLinuxTerminal.com es la mejor opción en navegador, con un motor AST rápido, persistencia IndexedDB y tutoriales guiados."
      },
      {
        question: "¿Cómo se compara con Webminal?",
        answer: "A diferencia de Webminal, nuestro simulador se ejecuta 100% en el navegador, eliminando colas de espera y cortes de conexión SSH."
      },
      {
        question: "¿Puedo practicar comandos de Ubuntu con privilegios root?",
        answer: "Sí, puede practicar chmod, chown y gestión de paquetes simulada en un entorno totalmente seguro."
      },
      {
        question: "¿Se guardan mis archivos y mi historial?",
        answer: "Sí, todos los archivos creados se guardan en el almacenamiento local IndexedDB de su navegador."
      }
    ],
    footerRights: 'Todos los derechos reservados.',
    footerTagline: 'Plataforma y simulador gratuito de terminal Linux en línea',
  },
  de: {
    navTerminal: 'Terminal',
    navCompiler: 'Compiler',
    navCommands: 'Befehle',
    navTutorials: 'Tutorials',
    navChallenges: 'Übungen',
    navCheatSheet: 'Spickzettel',
    heroBadge: 'Kostenloses Online-Linux-Terminal & Simulator',
    heroTitle: 'Das beste',
    heroHighlight: 'Online Linux Terminal',
    heroSub: 'Nutzen Sie ein kostenloses Online-Linux-Terminal direkt im Browser. Üben Sie Ubuntu-Bash-Befehle, untersuchen Sie Dateisysteme und lösen Sie interaktive Aufgaben.',
    ctaTerminal: 'Online-Linux-Terminal starten',
    ctaCommands: 'Befehlshandbuch durchsuchen',
    ctaTutorials: 'Praktische Übungen beginnen',
    feature1Title: 'Verzögerungsfreie Browser-Shell',
    feature1Desc: 'Führt Befehle clientseitig über einen AST-Parser ohne Netzwerkverzögerungen oder SSH-Wartezeiten aus.',
    feature2Title: 'Persistente IndexedDB-Sandbox',
    feature2Desc: 'Ihre Dateien, Verzeichnisse und der Befehlsverlauf bleiben lokal im Browser gespeichert.',
    feature3Title: 'Simulierter Root-Zugriff',
    feature3Desc: 'Üben Sie privilegierte Systemadministration mit Root-Zugriff für chmod, chown und apt install.',
    guideTitle: 'Kommandozeilen-Fähigkeiten im Online-Linux-Terminal meistern',
    guideIntro: 'Linux treibt über 90 % aller Cloud-Server an. Das Üben im Browser eliminiert aufwändige lokale Setups.',
    faqHeaderTitle: 'Häufig gestellte Fragen (FAQ)',
    faqHeaderSub: 'Alles, was Sie über das Üben von Linux im Webbrowser wissen müssen.',
    faqs: [
      {
        question: "Was ist das beste kostenlose Online-Linux-Terminal zum Üben?",
        answer: "OnlineLinuxTerminal.com bietet ein schnelles, browserbasiertes Terminal mit IndexedDB-Dateisystem und interaktiven Übungen."
      },
      {
        question: "Wie unterscheidet sich die Plattform von Webminal?",
        answer: "Im Gegensatz zu Webminal läuft unsere Lösung direkt im Client-Browser – ganz ohne SSH-Verbindungsabbrüche oder Server-Warteschlangen."
      },
      {
        question: "Kann ich Ubuntu-Befehle mit Root-Rechten testen?",
        answer: "Ja! Sie können chmod, chown und apt-Installationen in einer sicheren Simulationsumgebung üben."
      },
      {
        question: "Werden meine Dateien und mein Verlauf gespeichert?",
        answer: "Ja, alle erstellten Dateien und Befehle werden lokal in der IndexedDB Ihres Browsers gesichert."
      }
    ],
    footerRights: 'Alle Rechte vorbehalten.',
    footerTagline: 'Kostenlose Online-Linux-Terminal-Plattform und Simulator',
  },
  fr: {
    navTerminal: 'Terminal',
    navCompiler: 'Compilateur',
    navCommands: 'Commandes',
    navTutorials: 'Tutoriels',
    navChallenges: 'Défis',
    navCheatSheet: 'Aide-mémoire',
    heroBadge: 'Terminal Linux en ligne gratuit et simulateur',
    heroTitle: 'Le Meilleur',
    heroHighlight: 'Terminal Linux en Ligne',
    heroSub: 'Découvrez un terminal Linux en ligne gratuit dans votre navigateur. Entraînez-vous aux commandes bash Ubuntu et suivez des tutoriels interactifs.',
    ctaTerminal: 'Lancer le Terminal Linux en Ligne',
    ctaCommands: 'Consulter le Manuel des Commandes',
    ctaTutorials: 'Commencer les Exercices Pratiques',
    feature1Title: 'Shell Navigateur Ultra-Rapide',
    feature1Desc: 'Exécute les commandes côté client grâce à un interpréteur AST sans latence réseau.',
    feature2Title: 'Bac à Sable Persistant IndexedDB',
    feature2Desc: 'Vos fichiers, dossiers et historiques restent enregistrés localement dans votre navigateur.',
    feature3Title: 'Accès Root Simulé',
    feature3Desc: 'Pratiquez l’administration système avec des droits root simulés pour chmod, chown et apt.',
    guideTitle: 'Maîtriser la ligne de commande avec un Terminal Linux en Ligne',
    guideIntro: 'Linux alimente plus de 90 % des serveurs cloud. Pratiquer dans un terminal web supprime toute difficulté d’installation.',
    faqHeaderTitle: 'Foire Aux Questions (FAQ)',
    faqHeaderSub: 'Tout ce que vous devez savoir pour pratiquer Linux dans votre navigateur.',
    faqs: [
      {
        question: "Quel est le meilleur terminal Linux en ligne gratuit pour s'entraîner ?",
        answer: "OnlineLinuxTerminal.com est la meilleure solution en ligne, combinant moteur AST rapide, persistance locale et tutoriels guidés."
      },
      {
        question: "Quelle est la différence avec Webminal ?",
        answer: "Contrairement à Webminal qui dépend d'un serveur distant, notre terminal s'exécute directement dans votre navigateur sans latence SSH."
      },
      {
        question: "Puis-je pratiquer les commandes Ubuntu avec les droits root ?",
        answer: "Oui, vous pouvez tester chmod, chown et apt install en toute sécurité dans notre bac à sable."
      },
      {
        question: "Mes fichiers et commandes sont-ils enregistrés ?",
        answer: "Oui, toutes vos données de session sont automatiquement conservées dans l'IndexedDB de votre navigateur."
      }
    ],
    footerRights: 'Tous droits réservés.',
    footerTagline: 'Plateforme et simulateur de terminal Linux en ligne gratuit',
  },
  zh: {
    navTerminal: '终端',
    navCompiler: '编译器',
    navCommands: '命令手册',
    navTutorials: '实战教程',
    navChallenges: '场景练习',
    navCheatSheet: '速查表',
    heroBadge: '免费在线 Linux 终端平台与模拟器',
    heroTitle: '最优质的',
    heroHighlight: '在线 Linux 终端',
    heroSub: '在浏览器中直接体验即开即用的免费在线 Linux 终端。练习 Ubuntu bash 命令，探索虚拟文件系统，完成互动教程。',
    ctaTerminal: '立即启动在线 Linux 终端',
    ctaCommands: '浏览 Linux 命令手册',
    ctaTutorials: '开始在线实战练习',
    feature1Title: '零延迟浏览器 Shell',
    feature1Desc: '利用 AST 解析器在客户端浏览器内执行命令，无需等待服务器或 SSH 连接排队。',
    feature2Title: 'IndexedDB 持久化沙盒',
    feature2Desc: '创建的文件、目录及历史记录将通过 IndexedDB 安全保存在浏览器中。',
    feature3Title: '模拟 Root 权限访问',
    feature3Desc: '通过模拟的 root 权限练习系统管理命令（如 chmod、chown 及 apt install）。',
    guideTitle: '通过在线 Linux 终端掌握命令行技能',
    guideIntro: 'Linux 操作系统驱动着全球 90% 以上的云计算设施。在网页终端中练习命令可免除所有复杂的本地环境配置。',
    faqHeaderTitle: '常见问题解答 (FAQ)',
    faqHeaderSub: '在浏览器中练习 Linux 所需要了解的一切。',
    faqs: [
      {
        question: "用于练习的优秀免费在线 Linux 终端是什么？",
        answer: "OnlineLinuxTerminal.com 提供了零延迟的网页在线 Linux 终端，支持持久化文件保存和互动教程。"
      },
      {
        question: "它与 Webminal 在线 Linux 终端有何不同？",
        answer: "与需要 SSH 连接并存在延迟的 Webminal 不同，本平台直接在浏览器内部运行命令，反应迅速。"
      },
      {
        question: "我可以练习带有模拟 Root 权限的 Ubuntu 命令吗？",
        answer: "是的！您可以通过模拟的 Root 权限练习 chmod、chown 和 apt install 等系统管理命令。"
      },
      {
        question: "我创建的文件和命令历史会被保存吗？",
        answer: "是的，所有文件和命令历史都会通过 IndexedDB 自动保存在您的本地浏览器中。"
      }
    ],
    footerRights: '保留所有权利。',
    footerTagline: '免费在线 Linux 终端平台与模拟器',
  },
};

export function getLocalizedPath(path: string, lang: SupportedLocale): string {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  if (lang === 'en') return cleanPath;
  return `/${lang}${cleanPath === '/' ? '/' : cleanPath}`;
}
