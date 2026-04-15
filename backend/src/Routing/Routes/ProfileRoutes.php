<?php

declare(strict_types=1);

namespace App\Routing\Routes;

use App\Controllers\ProfileController;
use App\Http\Request;
use App\Routing\Router;

final class ProfileRoutes
{
    public static function register(Router $router, ProfileController $controller): void
    {
        $router->add('GET', '/users/profile', static fn (Request $request, array $params, ?array $authUser): array => $controller->getProfile($authUser ?? []), true);
        $router->add('PUT', '/users/profile', static fn (Request $request, array $params, ?array $authUser): array => $controller->updateProfile($request, $authUser ?? []), true);
    }
}
