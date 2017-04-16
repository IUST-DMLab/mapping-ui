//console.log('hello!');
//console.log(app);
app.controller('MainController', function ($scope, $timeout, RestService) {
    // RestService.translationRoot().success(function (data) {
    //             $scope.greeting = data;
    //         });
    $scope.go = go;
    $scope.edit = edit;

    $timeout(function () {
        go(0);
    }, 500);

    function go(page, search, approved, hasFarsi) {
        $scope.filter = {
            page: page,
            search: search,
            approved: approved,
            hasFarsi: hasFarsi
        };
        RestService.translationSearch($scope.filter.page, 40, $scope.filter.search, true, $scope.filter.approved, $scope.filter.hasFarsi)
            .success(function (data) {
                $scope.data = data;
                $scope.pages = [];
                for (var i = 0; i < data.pageCount; i++) $scope.pages.push(i + 1);
            });
    }

    function edit(index, edit) {
        var name = $scope.data.data[index].ontologyClass;

        if (edit.faLabel == undefined) edit.faLabel = $scope.data.data[index].faLabel;
        if (edit.faOtherLabels == undefined) edit.faOtherLabels = $scope.data.data[index].faOtherLabels;
        if (edit.note == undefined) edit.note = $scope.data.data[index].note;
        if (edit.approved == undefined) edit.approved = $scope.data.data[index].approved;

        RestService.translationTranslate(name, edit.faLabel,
            edit.faOtherLabels, edit.note, edit.approved).success(function (data) {
                $scope.data.data[index].faLabel = edit.faLabel;
                $scope.data.data[index].faOtherLabels = edit.faOtherLabels;
                $scope.data.data[index].note = edit.note;
                $scope.data.data[index].approved = edit.approved;
            });
    }
});


app.controller('TemplateMappingController', function ($scope, $timeout, RestService) {
    $scope.filter = {};
    $scope.go = go;
    $scope.save = save;
    $scope.revert = revert;
    $scope.clear = function () {
        $scope.filter = {};
        $scope.go(0);
    };

    $scope.autoCompleteOptions = {
        minimumChars: 1,
        data: function (term) {
            return RestService.ontologyClassSearch(0, 100, term);
        }
    };

    $timeout(function () {
        go(0);
    }, 500);

    function go(page) {

        if (page < 0 || ($scope.data && page > $scope.data.pageCount)) {
            $.growl.error({message: 'invalid page number !!!'});
            return;
        }

        RestService.templateMappingSearch(page, 40, $scope.filter.templateName, $scope.filter.ontologyClass, true, $scope.filter.approved)
            .success(function (data) {
                $scope.copy = angular.copy(data);
                $scope.data = data;
                $scope.data.pageNo = $scope.data.page + 1;
                $scope.data.searchPageNo = $scope.data.pageNo;
            });
    }

    function save(index, item) {
        RestService.templateMappingSave(item).success(function (data) {
            $scope.data.data[index].ontologyClass = data.ontologyClass;
            $scope.data.data[index].approved = data.approved;
        });
    }

    function revert(index) {
        $scope.data.data[index] = $scope.copy.data[index];
    }
});


app.controller('PropertyMappingController', function ($scope, $timeout, RestService) {
    $scope.filter = {};
    $scope.go = go;
    $scope.save = save;
    $scope.revert = revert;
    $scope.clear = function () {
        $scope.filter = {};
        $scope.go(0);
    };

    $scope.autoCompleteOptions = {
        minimumChars: 1,
        data: function (term) {
            return RestService.ontologyPropertyNameSearch(0, 100, term);
        }
    };

    $scope.statusList = ['Mapped', 'NearlyMapped', 'NotMapped', 'Multiple', 'Translated', 'AutoGenerated'];

    $timeout(function () {
        go(0);
    }, 500);

    function go(page) {

        if (page < 0 || ($scope.data && page > $scope.data.pageCount)) {
            $.growl.error({message: 'invalid page number !!!'});
            return;
        }

        RestService.propertyMappingSearch(page, 40, $scope.filter.templateName, $scope.filter.ontologyClass, $scope.filter.templateProperty,
            $scope.filter.ontologyProperty, true, $scope.filter.approved, $scope.filter.status)
            .success(function (data) {
                $scope.copy = angular.copy(data);
                $scope.data = data;
                $scope.data.pageNo = $scope.data.page + 1;
                $scope.data.searchPageNo = $scope.data.pageNo;
            });
    }

    function save(index, item) {
        RestService.propertyMappingSave(item).success(function (data) {
            $.extend($scope.data.data[index], data);
        });
    }

    function revert(index) {
        $scope.data.data[index] = $scope.copy.data[index];
    }
});


app.controller('TriplesController', function ($scope, $timeout, RestService) {

    $scope.filter = {};
    $scope.go = go;
    $scope.clear = function () {
        $scope.filter = {};
        $scope.go(0);
    };

    $timeout(function () {
        go(0);
    }, 500);

    function go(page) {

        if (page < 0 || ($scope.data && page > $scope.data.pageCount)) {
            $.growl.error({message: 'invalid page number !!!'});
            return;
        }

        RestService.triplesSearch(page, 40, $scope.filter.context, $scope.filter.subject, $scope.filter.predicate, $scope.filter.object)
            .success(function (data) {
                $scope.copy = angular.copy(data);
                $scope.data = data;
                $scope.data.pageNo = $scope.data.page + 1;
                $scope.data.searchPageNo = $scope.data.pageNo;
            });
    }
});


app.controller('TripleController', function ($scope, $timeout, RestService) {
    $scope.filter = {};
    $scope.go = go;

    $timeout(function () {
        go(0);
    }, 500);

    function go() {
        var subject = getParameterByName('subject');

        RestService.tripleBySubject(subject)
            .success(function (data) {
                $scope.data = data;

                var titleRow = $scope.data.data.filter(function (item) {
                    return item.predicate.endsWith('label');
                })[0];

                $scope.data.pageTitle = titleRow ? titleRow.object.value : '***';

                /**/
                var clazzRow = $scope.data.data.filter(function (item) {
                    return item.predicate.endsWith('instanceOf');
                })[0];

                var clazz = clazzRow ? clazzRow.object.value || '' : undefined;

                if (clazz) {
                    clazz = clazz.split('/').pop();
                    RestService.translate(clazz)
                        .success(function (tr) {
                            $scope.data.clazz = clazzRow ? tr.faLabel : '***';
                        });
                }

                $scope.data.data = data.data.filter(function (x) {
                    return !x.predicate.endsWith('label') && !x.predicate.endsWith('instanceOf');
                });

            });
    }

});


function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


