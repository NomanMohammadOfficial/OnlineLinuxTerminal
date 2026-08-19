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

export interface TranslationDictionary {
  navTerminal: string;
  navCommands: string;
  navTutorials: string;
  navChallenges: string;
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
  footerRights: string;
  footerTagline: string;
}

export const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    navTerminal: 'Terminal',
    navCommands: 'Commands',
    navTutorials: 'Tutorials',
    navChallenges: 'Challenges',
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
    footerRights: 'All rights reserved.',
    footerTagline: 'Free Online Linux Terminal Platform & Simulator',
  },
  ru: {
    navTerminal: 'Терминал',
    navCommands: 'Команды',
    navTutorials: 'Обучение',
    navChallenges: 'Задачи',
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
    footerRights: 'Все права защищены.',
    footerTagline: 'Бесплатная платформа онлайн терминала Linux',
  },
  es: {
    navTerminal: 'Terminal',
    navCommands: 'Comandos',
    navTutorials: 'Tutoriales',
    navChallenges: 'Desafíos',
    heroBadge: 'Plataforma y Simulador Gratis de Terminal Linux en Línea',
    heroTitle: 'La Mejor',
    heroHighlight: 'Terminal Linux en Línea',
    heroSub: 'Experimente una terminal Linux gratis en su navegador. Practique comandos bash de Ubuntu, inspeccione sistemas de archivos virtuales y ejecute tutoriales.',
    ctaTerminal: 'Iniciar Terminal Linux Gratis',
    ctaCommands: 'Manual de Comandos Linux',
    ctaTutorials: 'Iniciar Ejercicios de Práctica',
    feature1Title: 'Shell de Navegador Sin Retardo',
    feature1Desc: 'Ejecuta comandos Linux en el navegador con un analizador AST sin demoras de red ni colas SSH.',
    feature2Title: 'Entorno Guardado con IndexedDB',
    feature2Desc: 'Sus archivos, directorios e historial permanecen guardados en el almacenamiento de su navegador.',
    feature3Title: 'Acceso Root Simulado',
    feature3Desc: 'Practique administración de sistemas con acceso root simulado para chmod, chown y apt install.',
    guideTitle: 'Dominando la Línea de Comandos con una Terminal Linux en Línea',
    guideIntro: 'El sistema operativo Linux impulsa la infraestructura en la nube. Practicar comandos en una terminal web elimina la complicación de instalación.',
    footerRights: 'Todos los derechos reservados.',
    footerTagline: 'Plataforma y Simulador Gratis de Terminal Linux',
  },
  de: {
    navTerminal: 'Terminal',
    navCommands: 'Befehle',
    navTutorials: 'Tutorials',
    navChallenges: 'Aufgaben',
    heroBadge: 'Kostenloses Online Linux Terminal & Simulator',
    heroTitle: 'Das Beste',
    heroHighlight: 'Online Linux Terminal',
    heroSub: 'Erleben Sie ein kostenloses Online Linux Terminal im Browser. Üben Sie Ubuntu Bash-Befehle, prüfen Sie virtuelle Dateisysteme und absolvieren Sie Übungen.',
    ctaTerminal: 'Kostenloses Linux Terminal Starten',
    ctaCommands: 'Linux Befehlshandbuch',
    ctaTutorials: 'Praxis-Übungen Starten',
    feature1Title: 'Sofortige Browser-Shell',
    feature1Desc: 'Führt Befehle im Browser mit einem AST-Parser ohne Netzwerkverzögerungen oder SSH-Warteschlangen aus.',
    feature2Title: 'Speicherbarer IndexedDB-Sandbox',
    feature2Desc: 'Ihre Dateien, Verzeichnisse und Historie bleiben sicher im Browser gespeichert.',
    feature3Title: 'Simulierter Root-Zugriff',
    feature3Desc: 'Üben Sie Systemadministration mit simuliertem Root-Zugriff für chmod, chown und apt install.',
    guideTitle: 'Befehlszeilenkenntnisse mit einem Online Linux Terminal Meistern',
    guideIntro: 'Das Linux-Betriebssystem treibt über 90 % der Cloud-Infrastruktur an. Das Üben im Browser beseitigt alle Installationshürden.',
    footerRights: 'Alle Rechte vorbehalten.',
    footerTagline: 'Kostenlose Online-Linux-Terminal-Plattform',
  },
  fr: {
    navTerminal: 'Terminal',
    navCommands: 'Commandes',
    navTutorials: 'Tutoriels',
    navChallenges: 'Défis',
    heroBadge: 'Plateforme et Simulateur Gratuit de Terminal Linux en Ligne',
    heroTitle: 'Le Meilleur',
    heroHighlight: 'Terminal Linux en Ligne',
    heroSub: 'Utilisez un terminal Linux gratuit directement dans votre navigateur. Pratiquez les commandes bash Ubuntu, inspectez des systèmes de fichiers et suivez des cours.',
    ctaTerminal: 'Lancer le Terminal Linux Gratuit',
    ctaCommands: 'Manuel des Commandes Linux',
    ctaTutorials: 'Démarrer les Exercices',
    feature1Title: 'Shell Navigateur Instantané',
    feature1Desc: 'Exécute les commandes Linux côté client grâce à un analyseur AST sans délai réseau ni file d\'attente SSH.',
    feature2Title: 'Environnement Persistant IndexedDB',
    feature2Desc: 'Vos fichiers, dossiers et l\'historique restent sauvegardés dans votre navigateur.',
    feature3Title: 'Accès Root Simulé',
    feature3Desc: 'Pratiquez l\'administration système avec un accès root simulé pour chmod, chown et apt install.',
    guideTitle: 'Maîtriser la Ligne de Commande avec un Terminal Linux en Ligne',
    guideIntro: 'Le système Linux alimente les serveurs web et l\'infrastructure cloud. S\'entraîner dans un terminal web élimine tout besoin d\'installation.',
    footerRights: 'Tous droits réservés.',
    footerTagline: 'Plateforme et Simulateur Gratuit de Terminal Linux',
  },
  zh: {
    navTerminal: '终端',
    navCommands: '命令大全',
    navTutorials: '互动教程',
    navChallenges: '实战挑战',
    heroBadge: '免费在线 Linux 终端平台与模拟器',
    heroTitle: '优秀的',
    heroHighlight: '在线 Linux 终端',
    heroSub: '在浏览器中免费使用在线 Linux 终端。练习 Ubuntu bash 命令，查看虚拟文件系统并完成互动教程。',
    ctaTerminal: '启动免费在线 Linux 终端',
    ctaCommands: '查看 Linux 命令手册',
    ctaTutorials: '开始 Linux 实战练习',
    feature1Title: '零延迟浏览器 Shell',
    feature1Desc: '使用 AST 解析器在客户端直接运行 Linux 命令，无需 SSH 排队或网络延迟。',
    feature2Title: 'IndexedDB 持久化沙盒',
    feature2Desc: '创建的文件、目录及历史记录将通过 IndexedDB 安全保存在浏览器中。',
    feature3Title: '模拟 Root 权限访问',
    feature3Desc: '通过模拟的 root 权限练习系统管理命令（如 chmod、chown 及 apt install）。',
    guideTitle: '通过在线 Linux 终端掌握命令行技能',
    guideIntro: 'Linux 操作系统驱动着全球 90% 以上的云计算设施。在网页终端中练习命令可免除所有复杂的本地环境配置。',
    footerRights: '保留所有权利。',
    footerTagline: '免费在线 Linux 终端平台与模拟器',
  },
};

export function getLocalizedPath(path: string, lang: SupportedLocale): string {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  if (lang === 'en') return cleanPath;
  return `/${lang}${cleanPath === '/' ? '/' : cleanPath}`;
}
