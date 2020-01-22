<?php


$exif = exif_read_data('/Volumes/ssd240/projects/photo-location/example/DJI_0009.JPG', 0, true);

  print_r($exif);
