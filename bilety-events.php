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
$CACHE_FILE = sys_get_temp_dir() . '/kb_events_' . $KB_BASE . '.json';
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

function kb_fetch_url($url) {
    $ctx = stream_context_create(array(
        'http' => array(
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (compatible; MagicWebsite/1.0)\r\nAccept: text/html\r\n",
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
            CURLOPT_HTTPHEADER => array('Accept: text/html'),
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

preg_match_all(
    '#/iframe/single-event/(\d+)/([^/\"\']+)/([^?\"\']+)#u',
    $html,
    $matches,
    PREG_SET_ORDER
);

$events = array();
$seen = array();
$usedPaths = array();

foreach ($matches as $m) {
    $id = $m[1];
    $city = $m[2];
    $slug = $m[3];
    $key = $id . '|' . $city . '|' . $slug;
    if (isset($seen[$key])) {
        continue;
    }
    $seen[$key] = true;

    $title = '';
    $when = '';
    $image = '';
    $date = '';

    $pos = strpos($html, $m[0]);
    if ($pos !== false) {
        $chunk = substr($html, max(0, $pos - 1200), 3000);

        if (preg_match('#(https://assets\.kupbilecik\.pl/img/imprezy/[^\"\s]+)#', $chunk, $im)) {
            $image = html_entity_decode($im[1], ENT_QUOTES, 'UTF-8');
        }
        if (preg_match('#>(\d{1,2}\s+\p{L}+\s+20\d{2},[^<]{0,40})<#u', $chunk, $wm)) {
            $when = trim(html_entity_decode($wm[1], ENT_QUOTES, 'UTF-8'));
        }
        if (preg_match('#(20\d{2})-(\d{2})-(\d{2})#', $chunk, $iso)) {
            $date = $iso[1] . '-' . $iso[2] . '-' . $iso[3];
        } elseif ($when !== '' && preg_match('#(\d{1,2})\s+(\p{L}+)\s+(20\d{2})#u', $when, $dm)) {
            $mon = function_exists('mb_strtolower')
                ? mb_strtolower($dm[2], 'UTF-8')
                : strtolower($dm[2]);
            if (isset($months[$mon])) {
                $date = $dm[3] . '-' . $months[$mon] . '-' . str_pad($dm[1], 2, '0', STR_PAD_LEFT);
            }
        }

        if (preg_match_all('#>([^<]{5,100})<#u', $chunk, $texts)) {
            foreach ($texts[1] as $raw) {
                $candidate = trim(html_entity_decode($raw, ENT_QUOTES, 'UTF-8'));
                $low = function_exists('mb_strtolower')
                    ? mb_strtolower($candidate, 'UTF-8')
                    : strtolower($candidate);
                $len = function_exists('mb_strlen')
                    ? mb_strlen($candidate, 'UTF-8')
                    : strlen($candidate);

                if (preg_match('#bilety|ocena|dni|http|wybierz#u', $low)) {
                    continue;
                }
                if (strpos($low, 'iluzjonista') !== false || ($len > 12 && !preg_match('#^\d#', $candidate))) {
                    $title = $candidate;
                    if (strpos($low, 'iluzjonista') !== false) {
                        break;
                    }
                }
            }
        }
    }

    if ($title === '') {
        $title = ucwords(str_replace('-', ' ', $slug));
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
        'slug' => $slug,
        'date' => $date,
        'path' => $pathSlug,
        'title' => $title,
        'when' => $when,
        'image' => $image,
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
