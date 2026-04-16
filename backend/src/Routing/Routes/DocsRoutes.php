<?php

declare(strict_types=1);

namespace App\Routing\Routes;

use App\Controllers\DocsController;
use App\Http\Request;
use App\Routing\Router;

final class DocsRoutes
{
    public static function register(Router $router, DocsController $controller): void
    {
        $router->add(
            'GET',
            '/docs/verify',
            static fn (Request $request, array $params, ?array $authUser): array => $controller->verify(),
            true,
            ['admin'],
        );
    }
}
