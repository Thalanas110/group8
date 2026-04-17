<?php

declare(strict_types=1);

namespace App\Routing\Routes;

use App\Controllers\ExamViolationsController;
use App\Http\Request;
use App\Routing\Router;

final class ExamViolationRoutes
{
    public static function register(Router $router, ExamViolationsController $controller): void
    {
        // Student records a violation while taking the exam
        $router->add(
            'POST',
            '/exams/:id/violations',
            static fn (Request $request, array $params, ?array $authUser): array =>
                $controller->recordViolation($request, $params, $authUser ?? []),
            true,
            ['student'],
        );

        // Teacher / admin views all violations for an exam
        $router->add(
            'GET',
            '/exams/:id/violations',
            static fn (Request $request, array $params, ?array $authUser): array =>
                $controller->listViolations($params, $authUser ?? []),
            true,
            ['teacher', 'admin'],
        );
    }
}
