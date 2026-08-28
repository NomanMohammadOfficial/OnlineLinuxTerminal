import type { SupportedLocale } from './translations';
import type { LinuxCommand } from '../data/commandsData';

export const UI_LABELS: Record<SupportedLocale, {
  syntaxLabel: string;
  sandboxTitle: string;
  sandboxSubtitle: string;
  overviewTitle: string;
  flagsTitle: string;
  examplesTitle: string;
  errorsTitle: string;
  faqTitle: string;
  relatedTitle: string;
  copyBtn: string;
  copiedBtn: string;
  runBtn: string;
  fullWorkspaceBtn: string;
}> = {
  en: {
    syntaxLabel: 'Command Syntax',
    sandboxTitle: 'Try Live in Interactive Sandbox',
    sandboxSubtitle: 'Zero-install client simulation with real-time feedback.',
    overviewTitle: 'Overview & How it Works',
    flagsTitle: 'Common Flags & Command Options',
    examplesTitle: 'Practical Real-World Examples',
    errorsTitle: 'Common Errors & Troubleshooting',
    faqTitle: 'Frequently Asked Questions',
    relatedTitle: 'Related Linux Commands',
    copyBtn: 'Copy',
    copiedBtn: 'Copied!',
    runBtn: 'Run in Sandbox ⚡',
    fullWorkspaceBtn: 'Open in Fullscreen Workspace ↗'
  },
  ru: {
    syntaxLabel: 'Синтаксис команды',
    sandboxTitle: 'Попробуйте в интерактивной песочнице',
    sandboxSubtitle: 'Клиентская симуляция без установки с мгновенным результатом.',
    overviewTitle: 'Обзор и принцип работы',
    flagsTitle: 'Основные флаги и параметры команды',
    examplesTitle: 'Практические примеры использования',
    errorsTitle: 'Частые ошибки и их устранение',
    faqTitle: 'Часто задаваемые вопросы (FAQ)',
    relatedTitle: 'Похожие команды Linux',
    copyBtn: 'Копировать',
    copiedBtn: 'Скопировано!',
    runBtn: 'Запустить в терминале ⚡',
    fullWorkspaceBtn: 'Открыть в полноэкранном терминале ↗'
  },
  es: {
    syntaxLabel: 'Sintaxis del comando',
    sandboxTitle: 'Prueba en vivo en la terminal interactiva',
    sandboxSubtitle: 'Simulación del lado del cliente sin instalación y con respuesta inmediata.',
    overviewTitle: 'Descripción general y funcionamiento',
    flagsTitle: 'Opciones y banderas comunes',
    examplesTitle: 'Ejemplos prácticos del mundo real',
    errorsTitle: 'Errores comunes y solución de problemas',
    faqTitle: 'Preguntas frecuentes (FAQ)',
    relatedTitle: 'Comandos de Linux relacionados',
    copyBtn: 'Copiar',
    copiedBtn: '¡Copiado!',
    runBtn: 'Ejecutar en terminal ⚡',
    fullWorkspaceBtn: 'Abrir en terminal de pantalla completa ↗'
  },
  de: {
    syntaxLabel: 'Befehlssyntax',
    sandboxTitle: 'Live im interaktiven Terminal ausprobieren',
    sandboxSubtitle: 'Client-seitige Simulation ohne Installation mit sofortigem Feedback.',
    overviewTitle: 'Überblick & Funktionsweise',
    flagsTitle: 'Wichtige Optionen und Flags',
    examplesTitle: 'Praktische Anwendungsbeispiele',
    errorsTitle: 'Häufige Fehler & Fehlerbehebung',
    faqTitle: 'Häufig gestellte Fragen (FAQ)',
    relatedTitle: 'Verwandte Linux-Befehle',
    copyBtn: 'Kopieren',
    copiedBtn: 'Kopiert!',
    runBtn: 'Im Terminal ausführen ⚡',
    fullWorkspaceBtn: 'Im Vollbild-Terminal öffnen ↗'
  },
  fr: {
    syntaxLabel: 'Syntaxe de la commande',
    sandboxTitle: 'Essayer en direct dans le bac à sable interactif',
    sandboxSubtitle: 'Simulation côté client sans installation avec retour instantané.',
    overviewTitle: 'Aperçu et fonctionnement',
    flagsTitle: 'Options et drapeaux courants',
    examplesTitle: 'Exemples pratiques du monde réel',
    errorsTitle: 'Erreurs courantes et dépannage',
    faqTitle: 'Foire aux questions (FAQ)',
    relatedTitle: 'Commandes Linux associées',
    copyBtn: 'Copier',
    copiedBtn: 'Copié !',
    runBtn: 'Exécuter dans le terminal ⚡',
    fullWorkspaceBtn: 'Ouvrir dans le terminal plein écran ↗'
  },
  zh: {
    syntaxLabel: '命令语法',
    sandboxTitle: '在交互式终端沙盒中实时运行',
    sandboxSubtitle: '无需安装的客户端实时仿真环境。',
    overviewTitle: '概述与工作原理',
    flagsTitle: '常用参数与选项说明',
    examplesTitle: '实际生产案例与代码范例',
    errorsTitle: '常见错误与排错方案',
    faqTitle: '常见问题解答 (FAQ)',
    relatedTitle: '相关 Linux 常用命令',
    copyBtn: '复制',
    copiedBtn: '已复制！',
    runBtn: '在沙盒中运行 ⚡',
    fullWorkspaceBtn: '在全屏终端工作区中打开 ↗'
  }
};

export const CATEGORY_TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    'Navigation': 'Navigation',
    'File Operations': 'File Operations',
    'Text Processing': 'Text Processing',
    'Permissions & Security': 'Permissions & Security',
    'System & Processes': 'System & Processes',
    'Disk & Storage': 'Disk & Storage',
    'Networking & Transfer': 'Networking & Transfer',
    'Archives & Compression': 'Archives & Compression',
    'Package Management': 'Package Management',
    'Editors & Shell': 'Editors & Shell'
  },
  ru: {
    'Navigation': 'Навигация',
    'File Operations': 'Операции с файлами',
    'Text Processing': 'Обработка текста',
    'Permissions & Security': 'Права доступа и безопасность',
    'System & Processes': 'Система и процессы',
    'Disk & Storage': 'Диск и память',
    'Networking & Transfer': 'Сеть и передача данных',
    'Archives & Compression': 'Архивация и сжатие',
    'Package Management': 'Управление пакетами',
    'Editors & Shell': 'Редакторы и оболочка'
  },
  es: {
    'Navigation': 'Navegación',
    'File Operations': 'Operaciones de archivos',
    'Text Processing': 'Procesamiento de texto',
    'Permissions & Security': 'Permisos y seguridad',
    'System & Processes': 'Sistema y procesos',
    'Disk & Storage': 'Disco y almacenamiento',
    'Networking & Transfer': 'Red y transferencia',
    'Archives & Compression': 'Archivos y compresión',
    'Package Management': 'Gestión de paquetes',
    'Editors & Shell': 'Editores y shell'
  },
  de: {
    'Navigation': 'Navigation',
    'File Operations': 'Dateioperationen',
    'Text Processing': 'Textverarbeitung',
    'Permissions & Security': 'Berechtigungen & Sicherheit',
    'System & Processes': 'System & Prozesse',
    'Disk & Storage': 'Festplatte & Speicher',
    'Networking & Transfer': 'Netzwerk & Übertragung',
    'Archives & Compression': 'Archive & Komprimierung',
    'Package Management': 'Paketverwaltung',
    'Editors & Shell': 'Editoren & Shell'
  },
  fr: {
    'Navigation': 'Navigation',
    'File Operations': 'Opérations sur les fichiers',
    'Text Processing': 'Traitement de texte',
    'Permissions & Security': 'Permissions et sécurité',
    'System & Processes': 'Système et processus',
    'Disk & Storage': 'Disque et stockage',
    'Networking & Transfer': 'Réseau et transfert',
    'Archives & Compression': 'Archives et compression',
    'Package Management': 'Gestion des paquets',
    'Editors & Shell': 'Éditeurs et shell'
  },
  zh: {
    'Navigation': '文件导航',
    'File Operations': '文件操作',
    'Text Processing': '文本处理',
    'Permissions & Security': '权限与安全',
    'System & Processes': '系统与进程',
    'Disk & Storage': '磁盘与存储',
    'Networking & Transfer': '网络与传输',
    'Archives & Compression': '归档与压缩',
    'Package Management': '软件包管理',
    'Editors & Shell': '编辑器与Shell'
  }
};

export const COMMAND_NATIVE_DESCRIPTIONS: Record<string, Record<SupportedLocale, { summary: string; description: string }>> = {
  find: {
    en: {
      summary: 'Search for files and directories in a directory hierarchy based on name, type, size, or modification date.',
      description: 'The find command is one of the most powerful and frequently used command-line utilities in Linux. It recursively searches directories based on filename patterns, types, sizes, and timestamps.'
    },
    ru: {
      summary: 'Поиск файлов и директорий в иерархии каталогов по имени, типу, размеру или дате изменения.',
      description: 'Команда find — одна из самых мощных утилит в Linux. Она выполняет рекурсивный поиск файлов в реальном времени по маскам имен, правам доступа, типам файлов и времени модификации.'
    },
    es: {
      summary: 'Busque archivos y directorios en una jerarquía según el nombre, tipo, tamaño o fecha de modificación.',
      description: 'El comando find es una de las herramientas más potentes de Linux para buscar archivos de forma recursiva en el sistema de archivos en tiempo real.'
    },
    de: {
      summary: 'Durchsuchen Sie Verzeichnishierarchien nach Dateien basierend auf Name, Typ, Größe oder Änderungsdatum.',
      description: 'Der Befehl find ist eines der mächtigsten Linux-Werkzeuge zum rekursiven Suchen von Dateien und Verzeichnissen in Echtzeit.'
    },
    fr: {
      summary: 'Rechercher des fichiers et des répertoires dans une arborescence selon le nom, le type, la taille ou la date.',
      description: 'La commande find est l\'un des utilitaires les plus puissants de Linux pour rechercher récursivement des fichiers en temps réel.'
    },
    zh: {
      summary: '根据文件名、类型、大小或修改时间在目录层级中高效搜索文件与目录。',
      description: 'find 命令是 Linux 系统中最核心、最强大的文件查找工具。它直接在文件系统中进行实时递归扫描，支持通配符、修改时间、文件大小及权限等全方位条件过滤。'
    }
  },
  grep: {
    en: {
      summary: 'Search for matching string patterns or regular expressions inside text files.',
      description: 'Grep scans files line by line, matching input against regex patterns and printing matching lines.'
    },
    ru: {
      summary: 'Поиск текстовых шаблонов и регулярных выражений внутри файлов и потоков данных.',
      description: 'Grep — стандартная утилита Unix для построчного поиска текста. Незаменима для анализа системных логов и фильтрации вывода команд.'
    },
    es: {
      summary: 'Busque patrones de cadenas o expresiones regulares dentro de archivos de texto.',
      description: 'Grep es la utilidad estándar de Unix para buscar texto línea por línea mediante expresiones regulares en archivos y flujos de datos.'
    },
    de: {
      summary: 'Suchen Sie nach Zeichenfolgenmustern oder regulären Ausdrücken in Textdateien.',
      description: 'Grep ist das Standard-Unix-Werkzeug zum Durchsuchen von Textdateien und Logfiles mittels regulärer Ausdrücke.'
    },
    fr: {
      summary: 'Rechercher des motifs de chaînes ou des expressions régulières dans des fichiers texte.',
      description: 'Grep est l\'utilitaire standard Unix pour analyser et filtrer du texte ligne par ligne à l\'aide d\'expressions régulières.'
    },
    zh: {
      summary: '使用正则表达式或匹配字符串在文本文件与输出流中搜索内容。',
      description: 'Grep 是 Linux/Unix 环境下最著名的文本过滤与正则检索工具，逐行扫描输入内容并输出符合条件的行。'
    }
  },
  chmod: {
    en: {
      summary: 'Change file access permission mode bits for owner, group, and other users.',
      description: 'chmod alters file mode bits in octal (755, 644) or symbolic notation to control read, write, and execute permissions.'
    },
    ru: {
      summary: 'Изменение прав доступа к файлам и директориям для владельца, группы и остальных пользователей.',
      description: 'Команда chmod управляет правами на чтение, запись и выполнение с использованием восьмеричных масок (755, 644) или символьного синтаксиса.'
    },
    es: {
      summary: 'Cambie los bits de modo de permiso de acceso a archivos para propietario, grupo y otros.',
      description: 'chmod gestiona los permisos de lectura, escritura y ejecución de archivos en Linux mediante notación octal o simbólica.'
    },
    de: {
      summary: 'Ändern Sie Dateizugriffsberechtigungen für Besitzer, Gruppe und andere Benutzer.',
      description: 'chmod steuert Lese-, Schreib- und Ausführungsrechte für Dateien und Ordner unter Linux über Oktalwerte oder symbolische Modi.'
    },
    fr: {
      summary: 'Modifier les permissions d\'accès aux fichiers pour le propriétaire, le groupe et les autres.',
      description: 'chmod gère les droits de lecture, écriture et exécution sur les fichiers et répertoires en notation octale ou symbolique.'
    },
    zh: {
      summary: '更改所有者、用户组及其他用户的 Linux 文件读写执行权限。',
      description: 'chmod 命令用于配置 Linux 系统的文件与目录权限模式，精准控制读取(r)、写入(w)与执行(x)权限。'
    }
  },
  ls: {
    en: {
      summary: 'List directory contents including file sizes, permissions, ownership, and modification timestamps.',
      description: 'ls displays information about files and directories in the current folder or target path.'
    },
    ru: {
      summary: 'Отображение содержимого каталогов с метаданными, правами и размерами файлов.',
      description: 'Команда ls выводит список файлов и папок в текущей директории с поддержкой скрытых файлов (-a) и подробного формата (-l).'
    },
    es: {
      summary: 'Liste el contenido del directorio, incluidos permisos, tamaños y fechas.',
      description: 'ls muestra información sobre archivos y directorios con opciones detalladas como -l y -a.'
    },
    de: {
      summary: 'Verzeichnisinhalte auflisten mit Dateigrößen, Berechtigungen und Zeitstempeln.',
      description: 'ls ist der grundlegende Befehl zur Anzeige von Dateien und Verzeichnissen im Dateisystem.'
    },
    fr: {
      summary: 'Lister le contenu des répertoires avec les tailles, permissions et dates.',
      description: 'ls affiche la liste des fichiers et dossiers avec des formats détaillés comme -la.'
    },
    zh: {
      summary: '列出目录内容，包括文件大小、读写权限、所有者和修改时间戳。',
      description: 'ls 是 Linux 终端最基础也是使用频率最高的文件导航与目录内容查看命令。'
    }
  },
  cd: {
    en: {
      summary: 'Change the current working directory to navigate the filesystem hierarchy.',
      description: 'cd is the primary navigation command used to traverse between directories in Linux.'
    },
    ru: {
      summary: 'Смена текущего рабочего каталога для навигации по файловой системе.',
      description: 'Команда cd (Change Directory) позволяет перемещаться между папками файловой структуры Linux.'
    },
    es: {
      summary: 'Cambie el directorio de trabajo actual para navegar por el sistema de archivos.',
      description: 'cd es el comando de navegación principal para moverse entre carpetas en Linux.'
    },
    de: {
      summary: 'Wechseln Sie das aktuelle Arbeitsverzeichnis im Dateisystem.',
      description: 'cd ist der zentrale Navigationsbefehl zum Wechseln zwischen Verzeichnissen unter Linux.'
    },
    fr: {
      summary: 'Changer le répertoire de travail courant pour naviguer dans le système de fichiers.',
      description: 'cd est la commande principale pour se déplacer entre les dossiers dans Linux.'
    },
    zh: {
      summary: '切换当前工作目录以在 Linux 文件系统层级中快速导航。',
      description: 'cd 命令是 Linux 终端中切换工作目录的最基本命令，支持绝对路径与相对路径。'
    }
  },
  pwd: {
    en: {
      summary: 'Print the absolute path name of the current working directory.',
      description: 'pwd displays the full directory path from the root / to your active location.'
    },
    ru: {
      summary: 'Вывод абсолютного пути текущего рабочего каталога.',
      description: 'Команда pwd выводит полный путь от корневого каталога / до текущей рабочей папки.'
    },
    es: {
      summary: 'Muestra la ruta absoluta del directorio de trabajo actual.',
      description: 'pwd muestra la ruta completa desde la raíz / hasta el directorio actual.'
    },
    de: {
      summary: 'Druckt den absoluten Pfad des aktuellen Arbeitsverzeichnisses.',
      description: 'pwd gibt den vollständigen Pfad vom Wurzelverzeichnis / bis zum aktuellen Ordner aus.'
    },
    fr: {
      summary: 'Afficher le chemin absolu du répertoire de travail actuel.',
      description: 'pwd renvoie le chemin complet depuis la racine / jusqu\'au dossier actif.'
    },
    zh: {
      summary: '打印输出当前工作目录的完整绝对路径。',
      description: 'pwd (Print Working Directory) 显示当前在终端中所在的完整路径。'
    }
  },
  cat: {
    en: {
      summary: 'Concatenate and print file contents directly to the terminal standard output.',
      description: 'cat reads files sequentially and writes their contents to standard output.'
    },
    ru: {
      summary: 'Чтение и объединение содержимого файлов с выводом в терминал.',
      description: 'Команда cat выводит текст файлов напрямую в стандартный вывод терминала.'
    },
    es: {
      summary: 'Concatene e imprima el contenido de archivos en la salida estándar.',
      description: 'cat lee archivos secuencialmente e imprime su contenido en la pantalla del terminal.'
    },
    de: {
      summary: 'Dateiinhalte verketten und auf der Standardausgabe ausgeben.',
      description: 'cat gibt den gesamten Inhalt einer Datei direkt auf der Konsole aus.'
    },
    fr: {
      summary: 'Concaténer et afficher le contenu des fichiers sur la sortie standard.',
      description: 'cat lit et affiche rapidement le texte d\'un ou plusieurs fichiers dans le terminal.'
    },
    zh: {
      summary: '连接文件并在终端标准输出上打印文件内容。',
      description: 'cat 用于快速查看或合并文本文件内容，常与重定向和管道结合使用。'
    }
  },
  curl: {
    en: {
      summary: 'Transfer data to or from a network server using HTTP, HTTPS, FTP, and REST APIs.',
      description: 'curl is a command-line tool to test REST endpoints, download files, and send HTTP requests.'
    },
    ru: {
      summary: 'Передача данных и выполнение сетевых запросов по протоколам HTTP, HTTPS и REST API.',
      description: 'curl — инструмент командной строки для скачивания файлов, проверки API и отправки HTTP-запросов.'
    },
    es: {
      summary: 'Transfiera datos desde o hacia un servidor de red usando HTTP, HTTPS y API REST.',
      description: 'curl permite interactuar con servicios web, descargar archivos y realizar solicitudes HTTP.'
    },
    de: {
      summary: 'Datenübertragung über Netzwerkprotokolle wie HTTP, HTTPS und REST-APIs.',
      description: 'curl ist das Standardwerkzeug für Webanfragen, API-Tests und Datei-Downloads im Terminal.'
    },
    fr: {
      summary: 'Transférer des données depuis ou vers un serveur via HTTP, HTTPS et API REST.',
      description: 'curl est l\'outil en ligne de commande pour envoyer des requêtes HTTP et tester des API.'
    },
    zh: {
      summary: '通过 HTTP、HTTPS、FTP 和 REST API 在网络服务器之间传输数据。',
      description: 'curl 是最强大的网络数据传输与接口调试工具，广泛用于接口测试与文件下载。'
    }
  },
  tar: {
    en: {
      summary: 'Archive multiple files into a single tape archive (.tar) or compressed (.tar.gz) package.',
      description: 'tar combines files and directories into single archive archives and extracts them.'
    },
    ru: {
      summary: 'Создание и распаковка архивов файлов (.tar, .tar.gz, .tgz).',
      description: 'Команда tar объединяет группы файлов в архивные пакеты и распаковывает их сжатые версии.'
    },
    es: {
      summary: 'Empaquete y comprima múltiples archivos en un archivo tar (.tar.gz).',
      description: 'tar crea paquetes de archivos combinados y extrae archivos comprimidos en Linux.'
    },
    de: {
      summary: 'Dateien in Archivdateien (.tar, .tar.gz) packen und entpacken.',
      description: 'tar ist das Standardprogramm zum Erstellen und Entpacken von Archiven unter Linux.'
    },
    fr: {
      summary: 'Créer et extraire des archives de fichiers compressées (.tar.gz, .tgz).',
      description: 'tar regroupe des fichiers dans une archive unique et gère la décompression.'
    },
    zh: {
      summary: '创建、查看和解压 .tar 及 .tar.gz 压缩归档文件。',
      description: 'tar 是 Linux 下最常用的归档打包与解压工具，支持 gzip、bzip2 等多种压缩算法。'
    }
  },
  ps: {
    en: {
      summary: 'Report a snapshot of the currently active processes running in the operating system.',
      description: 'ps provides process IDs (PID), memory and CPU usage, and command invocations.'
    },
    ru: {
      summary: 'Отображение моментального снимка активных процессов операционной системы.',
      description: 'Команда ps выводит список запущенных процессов, идентификаторы PID, использование CPU и памяти.'
    },
    es: {
      summary: 'Muestra una instantánea de los procesos activos en ejecución.',
      description: 'ps informa sobre procesos en curso, PIDs, consumo de memoria y CPU en Linux.'
    },
    de: {
      summary: 'Momentaufnahme der aktuell ausgeführten Systemprozesse anzeigen.',
      description: 'ps liefert Prozess-IDs (PID), CPU- und Speicherauslastung sowie Befehlsaufrufe.'
    },
    fr: {
      summary: 'Afficher un instantané des processus en cours d\'exécution dans le système.',
      description: 'ps liste les processus actifs avec leurs identifiants PID et leur consommation de ressources.'
    },
    zh: {
      summary: '报告当前操作系统中正在运行的活动进程状态快照。',
      description: 'ps 查看系统运行中的进程快照，显示进程ID(PID)、CPU与内存占用率及命令参数。'
    }
  }
};

export function getLocalizedCommandData(cmd: LinuxCommand, lang: SupportedLocale) {
  const labels = UI_LABELS[lang] || UI_LABELS.en;
  const category = CATEGORY_TRANSLATIONS[lang]?.[cmd.category] || cmd.category;
  const native = COMMAND_NATIVE_DESCRIPTIONS[cmd.slug]?.[lang];

  return {
    ...cmd,
    category,
    summary: native?.summary || cmd.summary,
    description: native?.description || cmd.description,
    labels,
  };
}
