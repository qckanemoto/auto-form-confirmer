<!DOCTYPE html>
<html>
<head>
	<title>thanks</title>
	<link href="../auto-form-confirmer.css" rel="stylesheet" type="text/css" />
	<link href="style.css" rel="stylesheet" type="text/css" />
</head>
<body>
	<div id="thanks">
		<h1>dump of $_POST</h1>
		<?php
		echo '<pre>';
		var_dump(h($_POST));
		echo '</pre>';
		?>
	</div>
</body>
</html>
<?php
	function h($a) {
		if (is_array($a)) {
			foreach ($a as $i => $v) {
				$ret[$i] = h($v);
			}
			return $ret;
		}
		$ret = htmlspecialchars($a);
		return $ret;
	}
?>
