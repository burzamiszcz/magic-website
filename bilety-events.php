<?php
/**
 * Lista wydarzeń z KupBilecik (do ładnych URL-i /bilety/{slug-miasto-data}).
 * Kompatybilne z PHP 7.4+.
 */
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: public, max-age=300');

$KB_BASE = '25346';
$KB_USER = '5681';
$KB_TOKEN = '6c33b987b8aaa8ee45bcdcd6b0ceb79f';
$CACHE_FILE = sys_get_temp_dir() . '/kb_events_v3_' . $KB_BASE . '.json';
$CACHE_TTL = 300;

if (is_file($CACHE_FILE) && (time() - filemtime($CACHE_FILE)) < $CACHE_TTL) {
    readfile($CACHE_FILE);
    exit;
}

$months = array(
    'stycznia' => '01', 'lutego' => '02', 'marca' => '03', 'kwietnia' => '04',
    'maja' => '05', 'czerwca' => '06', 'lipca' => '07', 'sierpnia' => '08',
    'wrzesnia' => '09', 'września' => '09', 'pazdziernika' => '10', 'października' => '10',
    'listopada' => '11', 'grudnia' => '12',
);

$listUrl = 'https://www.kupbilecik.pl/iframe/events?' . http_build_query(array(
    'frame_base' => $KB_BASE,
    'frame_list_length' => '50',
    'frame_primary_bg_color' => '7b219f',
    'nolinks' => '',
    'u' => $KB_USER,
    'v' => '1.0',
    'token' => $KB_TOKEN,
));

function kb_fetch_url($url, $extraHeaders = array()) {
    $ctx = stream_context_create(array(
        'http' => array(
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (compatible; MagicWebsite/1.0)\r\nAccept: text/html\r\n"
                . ($extraHeaders ? implode("\r\n", $extraHeaders) . "\r\n" : ''),
            'timeout' => 12,
            'ignore_errors' => true,
        ),
        'ssl' => array(
            'verify_peer' => true,
            'verify_peer_name' => true,
        ),
    ));

    $html = @file_get_contents($url, false, $ctx);
    if ($html !== false && $html !== '') {
        return $html;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; MagicWebsite/1.0)',
            CURLOPT_HTTPHEADER => array_merge(array('Accept: text/html'), $extraHeaders),
        ));
        $html = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($html !== false && $html !== '' && $code >= 200 && $code < 400) {
            return $html;
        }
    }

    return false;
}

$html = kb_fetch_url($listUrl);
if ($html === false || $html === '') {
    http_response_code(502);
    echo json_encode(array(
        'ok' => false,
        'error' => 'Nie udało się pobrać listy wydarzeń',
        'events' => array(),
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

// Ceny wolnych miejsc z mapy numerowanej (places[].price.normal / types[].value)
function kb_collect_prices($node, &$prices) {
    if (!is_array($node)) {
        return;
    }
    if (isset($node['price']) && is_array($node['price'])
        && isset($node['status']) && $node['status'] === 'free'
        && (!isset($node['active']) || $node['active'])) {
        $vals = array(isset($node['price']['normal']) ? $node['price']['normal'] : null);
        if (!empty($node['price']['types']) && is_array($node['price']['types'])) {
            foreach ($node['price']['types'] as $t) {
                if (is_array($t) && isset($t['value'])) {
                    $vals[] = $t['value'];
                }
            }
        }
        foreach ($vals as $v) {
            if (is_numeric($v) && (float) $v > 0) {
                $prices[] = (float) $v;
            }
        }
    }
    foreach ($node as $k => $v) {
        if ($k !== 'price' && is_array($v)) {
            kb_collect_prices($v, $prices);
        }
    }
}

/**
 * Najniższa cena dostępnego miejsca (zł) z publicznego endpointu KupBilecik.
 * Zwraca liczbę albo null (brak miejsc / błąd) — wtedy front ukrywa cenę.
 */
function kb_min_price($id) {
    $json = kb_fetch_url(
        'https://www.kupbilecik.pl/pl/event/get-seats/' . rawurlencode($id),
        // bez tego endpoint przekierowuje na stronę HTML zamiast zwrócić JSON
        array('X-Requested-With: XMLHttpRequest', 'Referer: https://www.kupbilecik.pl/')
    );
    if ($json === false) {
        return null;
    }
    $d = json_decode($json, true);
    if (!is_array($d)) {
        return null;
    }
    $prices = array();
    if (!empty($d['notnum']) && is_array($d['notnum'])) {
        foreach ($d['notnum'] as $row) {
            if (!is_array($row)) {
                continue;
            }
            if (isset($row['Count']) && (int) $row['Count'] <= 0) {
                continue;
            }
            $p = isset($row['cart_price']) ? $row['cart_price'] : (isset($row['Cena_miejsce']) ? $row['Cena_miejsce'] : null);
            if (is_numeric($p) && (float) $p > 0) {
                $prices[] = (float) $p;
            }
        }
    }
    if (!empty($d['schema'])) {
        $schema = $d['schema'];
        if (is_string($schema)) {
            $schema = json_decode(html_entity_decode($schema, ENT_QUOTES, 'UTF-8'), true);
        }
        kb_collect_prices($schema, $prices);
    }
    if (!$prices) {
        return null;
    }
    $min = min($prices);
    return $min == floor($min) ? (int) $min : round($min, 2);
}

function kb_text($fragment) {
    $t = html_entity_decode(strip_tags($fragment), ENT_QUOTES, 'UTF-8');
    return trim(preg_replace('#\s+#u', ' ', $t));
}

preg_match_all(
    '#/iframe/single-event/(\d+)/([^/\"\']+)/([^?\"\']+)#u',
    $html,
    $matches,
    PREG_SET_ORDER | PREG_OFFSET_CAPTURE
);

// Każde wydarzenie ma kilka linków w jednej karcie. Blok karty = od pierwszego
// linku danego ID do pierwszego linku kolejnego wydarzenia (bez mieszania sąsiadów).
$firsts = array();
$seenIds = array();
foreach ($matches as $m) {
    $id = $m[1][0];
    if (isset($seenIds[$id])) {
        continue;
    }
    $seenIds[$id] = true;
    $firsts[] = array('offset' => $m[0][1], 'id' => $id, 'city' => $m[2][0], 'slug' => $m[3][0]);
}

$events = array();
$usedPaths = array();

foreach ($firsts as $i => $f) {
    $id = $f['id'];
    $city = $f['city'];
    $slug = $f['slug'];
    $start = $f['offset'];
    $end = isset($firsts[$i + 1]) ? $firsts[$i + 1]['offset'] : min(strlen($html), $start + 8000);
    $chunk = substr($html, $start, $end - $start);

    $title = '';
    if (preg_match('#<h2[^>]*>\s*<a[^>]*>(.*?)</a>#us', $chunk, $tm)) {
        $title = kb_text($tm[1]);
    }
    if ($title === '') {
        $title = ucwords(str_replace('-', ' ', $slug));
    }

    $image = '';
    if (preg_match('#(?:data-src|src)="(https://assets\.kupbilecik\.pl/img/(?:baza|imprezy)/[^"]+)"#', $chunk, $im)) {
        $image = html_entity_decode($im[1], ENT_QUOTES, 'UTF-8');
    }

    $when = '';
    $isoDt = '';
    if (preg_match('#<time[^>]*datetime="([^"]*)"[^>]*>(.*?)</time>#us', $chunk, $wm)) {
        $isoDt = html_entity_decode($wm[1], ENT_QUOTES, 'UTF-8');
        $when = kb_text($wm[2]);
    }

    $cityName = '';
    if (preg_match('#href="/pl/city/\d+/[^"]*"[^>]*>\s*([^<]+?)\s*</a>#u', $chunk, $cm)) {
        $cityName = kb_text($cm[1]);
    }

    $place = '';
    if (preg_match('#href="/pl/place/\d+/[^"]*"[^>]*>\s*([^<]+?)\s*</a>#u', $chunk, $pm)) {
        $place = kb_text($pm[1]);
    }

    $date = '';
    if (preg_match('#^(20\d{2})-(\d{2})-(\d{2})#', $isoDt, $iso)) {
        $date = $iso[1] . '-' . $iso[2] . '-' . $iso[3];
    } elseif ($when !== '' && preg_match('#(\d{1,2})\s+(\p{L}+)\s+(20\d{2})#u', $when, $dm)) {
        $mon = function_exists('mb_strtolower')
            ? mb_strtolower($dm[2], 'UTF-8')
            : strtolower($dm[2]);
        if (isset($months[$mon])) {
            $date = $dm[3] . '-' . $months[$mon] . '-' . str_pad($dm[1], 2, '0', STR_PAD_LEFT);
        }
    }

    $base = $slug . '-' . $city;
    $pathSlug = $date !== '' ? ($base . '-' . $date) : ($base . '-' . $id);
    if (isset($usedPaths[$pathSlug])) {
        $pathSlug = $base . '-' . $id;
    }
    $usedPaths[$pathSlug] = true;

    $events[] = array(
        'id' => $id,
        'city' => $city,
        'cityName' => $cityName,
        'place' => $place,
        'slug' => $slug,
        'date' => $date,
        'path' => $pathSlug,
        'title' => $title,
        'when' => $when,
        'image' => $image,
        'minPrice' => kb_min_price($id),
        'embed' => 'https://www.kupbilecik.pl/iframe/single-event/' . rawurlencode($id) . '/' . rawurlencode($city) . '/' . rawurlencode($slug)
            . '?' . http_build_query(array(
                'uiframe' => $KB_USER,
                'u' => $KB_USER,
                'token' => $KB_TOKEN,
            )),
    );
}

$payload = json_encode(array(
    'ok' => true,
    'updatedAt' => date('c'),
    'events' => array_values($events),
), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

@file_put_contents($CACHE_FILE, $payload);
echo $payload;
