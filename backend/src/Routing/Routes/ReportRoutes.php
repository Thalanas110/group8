<?php

declare(strict_types=1);

namespace App\Routing\Routes;

use App\Controllers\ReportsController;
use App\Http\Request;
use App\Routing\Router;

final class ReportRoutes
{
    public static function register(Router $router, ReportsController $controller): void
    {
        $router->add('GET', '/reports/exam-performance', static fn (Request $request, array $params, ?array $authUser): array => $controller->getExamPerformance($authUser ?? []), true, ['admin', 'teacher']);
        $router->add('GET', '/reports/pass-fail', static fn (Request $request, array $params, ?array $authUser): array => $controller->getPassFail($authUser ?? []), true, ['admin', 'teacher']);
        $router->add('GET', '/reports/question-analytics', static fn (Request $request, array $params, ?array $authUser): array => $controller->getQuestionAnalytics($authUser ?? []), true, ['admin', 'teacher']);
    }
}
