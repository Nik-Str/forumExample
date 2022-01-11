--Subject
CREATE TABLE `subject` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `sub_index` varchar(50) DEFAULT NULL,
  `sub_short` varchar(11) DEFAULT NULL,
  `active` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10875 DEFAULT CHARSET=utf8;

--Thread
CREATE TABLE `thread` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `thread_title` varchar(255) DEFAULT NULL,
  `thread_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `subject_id` int(11) unsigned NOT NULL,
  `sub_index` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `thread_subject` (`subject_id`),
  CONSTRAINT `thread_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=755 DEFAULT CHARSET=utf8;

--Content
CREATE TABLE `content` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `con_text` varchar(500) DEFAULT NULL,
  `con_like` int(11) NOT NULL DEFAULT '0',
  `con_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `con_user` varchar(255) DEFAULT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `thread_id` int(11) unsigned NOT NULL,
  `subject_id` int(11) unsigned NOT NULL,
  `thread_title` varchar(255) DEFAULT NULL,
  `sub_index` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userID` (`user_id`),
  KEY `threadID` (`thread_id`),
  KEY `subjectID` (`subject_id`),
  CONSTRAINT `subjectID` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`),
  CONSTRAINT `threadID` FOREIGN KEY (`thread_id`) REFERENCES `thread` (`id`),
  CONSTRAINT `userID` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3305 DEFAULT CHARSET=utf8;

--Likes
CREATE TABLE `likes` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) unsigned NOT NULL,
  `content_id` int(11) unsigned NOT NULL,
  `like_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contennntt` (`content_id`),
  KEY `uuussser` (`user_id`),
  CONSTRAINT `contennntt` FOREIGN KEY (`content_id`) REFERENCES `content` (`id`),
  CONSTRAINT `uuussser` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1275 DEFAULT CHARSET=utf8;

--User
CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) DEFAULT NULL,
  `user_pass` varchar(255) DEFAULT NULL,
  `user_joined` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=315 DEFAULT CHARSET=utf8;