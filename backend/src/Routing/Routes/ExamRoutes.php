<?php

declare(strict_types=1);

namespace App\Routing\Routes;

use App\Controllers\ExamsController;
use App\Http\Request;
use App\Routing\Router;

final class ExamRoutes
{
    public static function register(Router $router, ExamsController $controller): void
    {
        $router->add('GET', '/exams', static fn (Request $request, array $params, ?array $authUser): array => $controller->getExams($authUser ?? []), true);
        $router->add('POST', '/exams', static fn (Request $request, array $params, ?array $authUser): array => $controller->createExam($request, $authUser ?? []), true, ['admin', 'teacher']);
        $router->add('GET', '/exams/:id', static fn (Request $request, array $params, ?array $authUser): array => $controller->getExamById($params, $authUser ?? []), true);
        $router->add('PUT', '/exams/:id', static fn (Request $request, array $params, ?array $authUser): array => $controller->updateExam($request, $params, $authUser ?? []), true, ['admin', 'teacher']);
        $router->add('DELETE', '/exams/:id', static fn (Request $request, array $params, ?array $authUser): array => $controller->deleteExam($params, $authUser ?? []), true, ['admin', 'teacher']);
    }
}
