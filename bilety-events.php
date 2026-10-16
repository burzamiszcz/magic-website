<?php
/**
 * Lista wydarzeń z KupBilecik (do ładnych URL-i /bilety/{slug-miasto-data}).
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

$months = [
    'stycznia' => '01', 'lutego' => '02', 'marca' => '03', 'kwietnia' => '04',
    'maja' => '05', 'czerwca' => '06', 'lipca' => '07', 'sierpnia' => '08',
    'wrzesnia' => '09', 'września' => '09', 'pazdziernika' => '10', 'października' => '10',
    'listopada' => '11', 'grudnia' => '12',
];

$listUrl = 'https://www.kupbilecik.pl/iframe/events?' . http_build_query([
    'frame_base' => $KB_BASE,
    'frame_list_length' => '50',
    'frame_primary_bg_color' => '7b219f',
    'nolinks' => '',
    'u' => $KB_USER,
    'v' => '1.0',
    'token' => $KB_TOKEN,
]);

$ctx = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: Mozilla/5.0 (compatible; MagicWebsite/1.0)\r\nAccept: text/html\r\n",
        'timeout' => 12,
    ],
]);

$html = @file_get_contents($listUrl, false, $ctx);
if ($html === false || $html === '') {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'Nie udało się pobrać listy wydarzeń', 'events' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

preg_match_all(
    '#/iframe/single-event/(\d+)/([^/\"\']+)/([^?\"\']+)#u',
    $html,
    $matches,
    PREG_SET_ORDER
);

$events = [];
$seen = [];
$usedPaths = [];

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
            $mon = mb_strtolower($dm[2], 'UTF-8');
            if (isset($months[$mon])) {
                $date = $dm[3] . '-' . $months[$mon] . '-' . str_pad($dm[1], 2, '0', STR_PAD_LEFT);
            }
        }

        if (preg_match_all('#>([^<]{5,100})<#u', $chunk, $texts)) {
            foreach ($texts[1] as $raw) {
                $candidate = trim(html_entity_decode($raw, ENT_QUOTES, 'UTF-8'));
                $low = mb_strtolower($candidate, 'UTF-8');
                if (preg_match('#bilety|ocena|dni|http|wybierz#u', $low)) {
                    continue;
                }
                if (str_contains($low, 'iluzjonista') || (mb_strlen($candidate) > 12 && !preg_match('#^\d#', $candidate))) {
                    $title = $candidate;
                    if (str_contains($low, 'iluzjonista')) {
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

    $events[] = [
        'id' => $id,
        'city' => $city,
        'slug' => $slug,
        'date' => $date,
        'path' => $pathSlug,
        'title' => $title,
        'when' => $when,
        'image' => $image,
        'embed' => 'https://www.kupbilecik.pl/iframe/single-event/' . rawurlencode($id) . '/' . rawurlencode($city) . '/' . rawurlencode($slug)
            . '?' . http_build_query([
                'uiframe' => $KB_USER,
                'u' => $KB_USER,
                'token' => $KB_TOKEN,
            ]),
    ];
}

$payload = json_encode([
    'ok' => true,
    'updatedAt' => date('c'),
    'events' => array_values($events),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

@file_put_contents($CACHE_FILE, $payload);
echo $payload;
