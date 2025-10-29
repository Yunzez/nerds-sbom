<?php
//! Copyright (C) 2017 Christian Stransky
//!
//! This software may be modified and distributed under the terms
//! of the MIT license.  See the LICENSE file for details.

$dailyMaxInstances = 10;
// Hard limit, incase someone finds a way to abuse it
$maxInstances = 200;


// Register API keys at https://www.google.com/recaptcha/admin
// These are currently test keys that will pass any verifications.
$reCaptchaSiteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
$reCaptchaSecret = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

// AWS Credentials
$lang = '';
$awsAccessKey = '';
$awsSecretKey = '';
$awsRegion = '';

// AWS Settings
$image_id  = '';
$instance_type = '';
$securityGroupID = '';
$sshKeyName = '';


// Password is being replaced automatically, skip
$dbuser = 'created_instances_user';  
$dbpass = 'Z1a7bOFfFkvVuGh9Xt18J0XFbIhxTilg';  
$dbhost = 'db';  
$dbname = 'notebook';  

$redisIp = 'redis';
$redisQueue = 'queuedInstances';
$redisQueueBooting = 'queuedInstancesBooting';
$waitTimeoutForInstance = 120;

$poolSize = 5;
$poolCheckCommand = "nohup /usr/bin/php /var/www/tools/checkServerPool.php > /dev/null 2>&1 & echo $!";

$tokenGetUrl = '';
$tokenSetUrl = '';
?>
