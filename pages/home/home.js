function storeData(name, data) {
    var appData = Windows.Storage.ApplicationData.current;
    var rs = appData.roamingSettings;
    rs.values[name] = data;
}
function getData(name) {
    var appData = Windows.Storage.ApplicationData.current;
    var roamingSettings = appData.roamingSettings;
    return roamingSettings.values[name];
}
function logout() {
    localStorage.removeItem('fb_access_token');
    FB.setAccessToken(null);

    WinJS.Navigation.navigate('/pages/login/login.html');
}

(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            WinJS.Utilities.query('#logout').listen('click', logoutClicked, false);
            WinJS.Utilities.query("#postStatus").listen("submit", preventDefault, false);
            
            loadData();
        }
    });

    function preventDefault(e) {
        e.preventDefault();
    }

    function logoutClicked(e) {
        e.preventDefault();

        localStorage.removeItem('fb_access_token');
        FB.setAccessToken(null);

        WinJS.Navigation.navigate('/pages/login/login.html');
    }

    function loadData() {
        if (getData("name") == "" && getData("picture") == "") {
            FB.api('me', { fields: 'id,name,picture' }, function (res) {
                if (!res || res.error) {
                    console.log(!res ? 'error occurred' : res.error);
                    return;
                }

                $('#fullname').html('Hi ' + res.name + '!');

                $('.profilePic').attr('src', res.picture.data.url);
                // if the user does not have their picture set to public, this will not work below.
                // $('#picture').attr('src', 'http://graph.facebook.com/' + res.id + '/picture');

                /*for (var val in res) {
                    storeData(val, res.val);
                }*/
                storeData("name", res.name);
                storeData("picture", res.picture.data.url);
            });
        }
        else {
            $('#fullname').html('Hi ' + getData("name") + '!');

            $('.profilePic').attr('src', getData("picture"));
        }

        FB.api('me/groups', function (groups) {
            if (!groups || groups.error) {
                console.log(!groups ? 'error occurred' : groups.error);
                for (var i = 0; i < getData("numberOfGroups"); i++) {
                    $('#groups').append(
                        $('<li>').html(getData("gname"+ i)).append(
                                $('<span>').append(((getData(getData("gname" + i)) > 0) ? "(" + getData(getData("gname" + i)) + ")" : ""))
                    ));
                }
                return;
            }

            for (var i = 0; i < groups["data"].length; i++) {
                $('#groups').append(
                    $('<li>').html(groups["data"][i]["name"]).append(
                            $('<span>').append(((groups["data"][i]["unread"] > 0) ? "(" + groups["data"][i]["unread"] + ")" : ""))
                ));
                storeData("numberOfGroups", groups["data"].length);
                storeData("gname" + i, groups["data"][i]["name"]);
                storeData(groups["data"][i]["name"], groups["data"][i]["unread"]);
            }

        });
        FB.api('me/notifications', function (notifs) {
            if (!notifs || notifs.error) {
                console.log(!notifs ? 'error occurred' : notifs.error);
                return;
            }
            
            if (notifs["summary"]["unseen_count"] > 0) {
                $(".notifications").attr("class", "notifications unread").append(
                    $("<span>").attr("id", "count").append(notifs["summary"]["unseen_count"])
                    );
                $("#notifPop").append($("<ul>"));
                
                for (var i = 0; i < notifs["summary"]["unseen_count"]; i++) {
                    console.log(notifs["data"][i]);
                    $("#notifPop ul").append(
                        $("<li>").attr("id", i).append(
                            $("<a>").attr("href", notifs["data"][i]["link"]).attr("id", "list").append("Blah: " + notifs["data"][i]["title"])
                        )
                    );
                }
            }
            else
                $("#notifPop").append($("<span>").html("No New Notifications"));
        });

        FB.api('me/inbox', function (messages) {
            if (!messages || messages.error) {
                console.log(!messages ? 'error occurred' : messages.error);
                return;
            }
            if (messages["summary"]["unseen_count"] > 0) {
                $(".chat").attr("class", "chat unread").append($("<span>").attr("id", "count").html(messages["summary"]["unseen_count"]));
            }

            var i = 0;
            $("#chatPop").append($("<ul>"));
            for (var v in messages["data"]) {
                $("#chatPop ul").append(
                        $("<li>").append(
                            $("<a>").attr("href", messages["data"][i]["link"]).attr("id", "list").append(messages["data"][i]["to"]["data"][0]["name"] + " to " + messages["data"][i]["to"]["data"][1]["name"])
                ));
                i++;
            }

        });



    }

   
    
})();
function pStatus(form) {
    console.log("I'm trying");
    form = $("#postStatus");
    console.log($("#status").val());
    FB.api('me/feed', 'post', { message: $("#status").val() }, function (res) {
        if (!res || res.error) {
            console.log(!res ? 'error occurred' : res.error);
            return;
        }
        console.log('Post Id: ' + res.id);
    });
    $("#status").val("")
}

function isloggedin() {
    console.log("!!!!! TOKEN = " + getData("token"));
    console.log("!!!!!! ID = " + getData("id"));
    if (getData("token") != "" && getData("id") != undefined) {
        return true;
    }
    else
        return false;
}

if (!isloggedin())
    logout();