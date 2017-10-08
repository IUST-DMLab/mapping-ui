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
    $scope.PREFIX = 'http://194.225.227.161/mapping/html/triple.html?subject=';

    $timeout(function () {
        go(0);
    }, 500);

    // http://localhost:63342/mapping-ui/html/triple.html?subject=http://fkg.iust.ac.ir/resource/%D8%AD%D8%B3%D9%86_%D8%B1%D9%88%D8%AD%D8%A7%D9%86%DB%8C
    function go() {

        function PredicateSort(a, b) {
            if (a.name > b.name) return 1;
            if (a.name < b.name) return -1;
            return 0;
        }

        var subject = getParameterByName('subject');
        //handle http://dmls.iust.ac.ir/resource/sth (no parameters)
        if (subject == null) {
            var l = decodeURIComponent(window.location.href);
            if (l.indexOf('/resource') > -1 && l.indexOf('?') == -1)
                subject = 'http://fkg.iust.ac.ir/resource/' + l.substring(l.lastIndexOf('/') + 1);
            if (l.indexOf('/category') > -1 && l.indexOf('?') == -1)
                subject = 'http://fkg.iust.ac.ir/category/' + l.substring(l.lastIndexOf('/') + 1);
            if (l.indexOf('/ontology') > -1 && l.indexOf('?') == -1)
                subject = 'http://fkg.iust.ac.ir/ontology/' + l.substring(l.lastIndexOf('/') + 1);
            if (l.indexOf('/property') > -1 && l.indexOf('?') == -1)
                subject = 'http://fkg.iust.ac.ir/property/' + l.substring(l.lastIndexOf('/') + 1);
        }

        if (subject.indexOf('/ontology/') !== -1 || subject.indexOf('/property') !== -1) {
            function compare(a, b) {
                if (a.predicate > b.predicate) return 1;
                if (a.predicate < b.predicate) return -1;
                return 0;
            }

            function LangSort(a, b) {
                if (a.object.lang > b.object.lang) return 1;
                if (a.object.lang < b.object.lang) return -1;
                return 0;
                //return a.object.lang < b.object.lang;
            }

            RestService.ontologyBySubject(subject)
                .success(function (data) {

                    let list = angular.copy(data.data).sort(compare);
                    //console.log(list.map(x=>x.predicate));
                    let groups = [];
                    if (list.length)
                        groups.push({item: list[0], values: [list[0]]});

                    for (let i = 1; i < list.length; i++) {
                        let prev = list[i - 1];
                        let curr = list[i];

                        if (curr.predicate === prev.predicate) {
                            groups[groups.length - 1].values.push(curr);
                        }
                        else {
                            groups.push({item: curr, values: [curr]});
                        }
                    }
                    groups = groups
                        .map((g) => {
                            g.name = g.item.predicate.split('/').pop().split('#').pop();
                            return g;
                        }).sort(PredicateSort);
                    //console.log(groups);

                    let titles = data.data.filter(i => i.predicate === 'http://www.w3.org/2000/01/rdf-schema#label').sort(LangSort);
                    let pageTitle = titles.map(i => i.object.value).join(' - ');

                    $scope.data = {
                        ontologies: groups,
                        pageTitle: pageTitle
                    };
                });
        }
        else /*if (subject.indexOf('/resource/') !== -1)*/ {
            RestService.tripleBySubject2(subject)
                .success(function (data) {

                    let _triples = [];
                    let d2 = angular.copy(data);
                    for (let q in d2.triples) {
                        if (d2.triples.hasOwnProperty(q)) {
                            _triples.push({
                                name: q.split('/').pop().split('#').pop(),
                                predicate: q,
                                triples: d2.triples[q]
                            });
                        }
                    }
                    // d2.triples = undefined;
                    d2.items = _triples.sort(PredicateSort);

                    $scope.data = d2;

                    let titleTriple = data.triples['http://www.w3.org/2000/01/rdf-schema#label'];
                    let pageTitle = titleTriple ? (titleTriple[0] ? titleTriple[0].value : undefined) : undefined;
                    $scope.data.pageTitle = pageTitle || '***';

                    let picTriple = data.triples['http://fkg.iust.ac.ir/ontology/picture'];
                    let pagePic = picTriple ? (picTriple[0] ? picTriple[0].value : undefined) : undefined;
                    $scope.data.pagePic = pagePic || undefined;

                    // let typeRows = data.data.filter(i => i.predicate.indexOf('#type') !== -1);
                    let typeRows = data.triples['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'];
                    if (typeRows && typeRows.length) {
                        let N = typeRows.filter(v => v.value.endsWith('owl#NamedIndividual'))[0];
                        let C = typeRows.filter(v => v.value.endsWith('owl#Class'))[0];
                        let P = typeRows.filter(v => v.value.endsWith('owl#ObjectProperty'))[0];

                        if (N) {
                            let clazzRow = data.triples['http://www.w3.org/1999/02/22-rdf-syntax-ns#instanceOf'];
                            let clazz = clazzRow ? (clazzRow[0] ? clazzRow[0].value : '') : '';
                            if (clazz) {
                                clazz = clazz.split('/').pop();
                                RestService.translate(clazz)
                                    .success(function (tr) {
                                        $scope.data.clazzTitle = clazzRow ? tr.faLabel : '***';
                                    })
                                    .error(function () {
                                        $scope.data.clazzTitle = clazz;
                                    });
                            }
                        }
                        else if (C) {
                            $scope.data.clazzTitle = 'کلاس هستان‌شناسی';
                        }
                        else if (P) {
                            $scope.data.clazzTitle = 'خصیصه هستان‌شناسی';
                        }
                    }

                });
        }


        // RestService.tripleBySubject(subject)
        //     .success(function (data) {
        //         //console.log(data.data.map(x=>x.predicate));
        //         var list = angular.copy(data.data).sort(compare);
        //         //console.log(list.map(x=>x.predicate));
        //         var groups = [];
        //         if (list.length)
        //             groups.push({item: list[0], values: [list[0]]});
        //
        //         for (var i = 1; i < list.length; i++) {
        //             var prev = list[i - 1];
        //             var curr = list[i];
        //
        //             if (curr.predicate === prev.predicate) {
        //                 groups[groups.length - 1].values.push(curr);
        //             }
        //             else {
        //                 groups.push({item: curr, values: [curr]});
        //             }
        //         }
        //
        //         console.log(groups);
        //         $scope.data = {
        //             data: groups
        //         };
        //
        //         let titleRow = data.data.filter(function (item) {
        //             if (item.predicate.endsWith('label')) console.log(item.predicate, item.object.value);
        //             return item.predicate.endsWith('http://www.w3.org/2000/01/rdf-schema#label');
        //         })[0];
        //
        //         $scope.data.pageTitle = titleRow ? titleRow.object.value : '***';
        //
        //         // ****************************************************************
        //
        //         let picRow = data.data.filter(item => item.predicate.endsWith('/picture'))[0];
        //         $scope.data.pagePic = picRow ? picRow.object.value : '';
        //
        //         // ****************************************************************
        //         let typeRows = data.data.filter(i => i.predicate.indexOf('#type') !== -1);
        //
        //         if (typeRows.length) {
        //             let N = typeRows.filter(v => v.object.value.endsWith('owl#NamedIndividual'))[0];
        //             let C = typeRows.filter(v => v.object.value.endsWith('owl#Class'))[0];
        //             let P = typeRows.filter(v => v.object.value.endsWith('owl#ObjectProperty'))[0];
        //
        //             if (N) {
        //                 let clazzRow = data.data.filter(i => i.predicate.endsWith('instanceOf'))[0];
        //                 let clazz = clazzRow ? clazzRow.object.value || '' : undefined;
        //                 if (clazz) {
        //                     clazz = clazz.split('/').pop();
        //                     RestService.translate(clazz)
        //                         .success(function (tr) {
        //                             $scope.data.clazzTitle = clazzRow ? tr.faLabel : '***';
        //                         });
        //                 }
        //             }
        //             else if (C) {
        //                 $scope.data.clazzTitle = 'کلاس هستان‌شناسی';
        //             }
        //             else if (P) {
        //                 $scope.data.clazzTitle = 'خصیصه هستان‌شناسی';
        //             }
        //         }
        //     });
    }

});


app.controller('MappingsController', function ($scope, $timeout, RestService) {
    $scope.go = go;
    $scope.autoCompleteOptions = {
        minimumChars: 2,
        dropdownHeight: '200',
        data: function (term) {
            return RestService.predicatesSearch(term);
        }
    };

    $timeout(function () {
        go(0);
    }, 500);

    function go(page) {
        RestService.getMappings(page, 20)
            .success(function (data) {
                $scope.data = data;
                $scope.data.pageNo = $scope.data.page + 1;
                $scope.data.searchPageNo = $scope.data.pageNo;
            });
    }

    $scope.save = function () {

        function translate(items) {
            return items.map((r) => {
                return {
                    constant: r.constant,
                    predicate: r.predicate,
                    transform: r.transform,
                    type: r.type,
                    unit: r.unit
                }
            });
        }

        let items = $scope.selectedItemPropertyRules.concat($scope.selectedItemPropertyRecommendations);

        var rules = items.filter(r => r.valid);
        var recommendations = items.filter(r => !r.valid);

        for (let p of $scope.selectedItem.properties) {
            p.template = undefined; // todo : must be fixed on server side
            p.rules = translate(rules.filter(r => r.property === p.property));
            p.recommendations = translate(recommendations.filter(r => r.property === p.property));
        }
        $scope.selectedItem.creationEpoch = undefined; // todo : must be fixed on server side
        $scope.selectedItem.modificationEpoch = undefined; // todo : must be fixed on server side

        RestService.saveMappings($scope.selectedItem)
            .success(function () {
                $scope.hide();
                go($scope.data.page);
            });


    };

    $scope.show = function (item) {

        var rules = [];
        var recommendations = [];
        for (let p of item.properties) {
            for (let r of p.rules) {
                rules.push(_.assign({property: p.property, valid: true, editable: true}, r));
            }
            for (let r of p.recommendations) {
                recommendations.push(_.assign({property: p.property, valid: false, editable: true}, r));
            }
        }

        $scope.selectedItem = item;
        $scope.selectedItemPropertyRules = rules;
        $scope.selectedItemPropertyRecommendations = recommendations;

        $('#mapping').fadeIn();
    };

    $scope.hide = function () {
        $('#mapping').fadeOut();
    };

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


