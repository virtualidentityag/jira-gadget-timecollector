Ergebnisse der Gadget-Recherchen
================================

###Was ist ein Gadget? Das wichtigste in Kürze
Prinzpiell sind alle Atlassian Gadgets = [Google Gadgets](https://developers.google.com/gadgets/). Diese Zeichnen sich
vor allem dadurch aus, dass sie über ein zentrales .xml File definiert werden. Die genaue API des XMLs lässt sich in
der Google Doku oder [hier](https://developer.atlassian.com/display/GADGETS/Creating+your+Gadget+XML+Specification#CreatingyourGadgetXMLSpecification-ContentElement)
nachlesen - die wichtigsten Teile sind wohl aber die *ModulePrefs*, *UserPrefs* und der *Content*.

- **ModulePrefs**: Hier können von Jira vorgefertigte Features eingebunden werden, die von Atlassian bzw. JIRA automatisch
in das Plugin implementiert werden
- **UserPrefs**: Meist versteckte Form-Felder, über die User-Konfigurationen ein- und ausgegeben werden können (bspw. der
gewählte Filter)
- **Content**: Wie der Name sagt. Content kann über zwei Arten eingebunden werden:
-- Direkt im .xml per \[\!CDATA\]-Tag (type="html"). Wenn ich das richtig verstehe interpretiert JIRA den Inhalt hier erstmal
als Velocity Templates, da man über *#requireResource()* eigene Web-Ressourcen sowie vorgefertigte Webressourcen von Atlassian
einbetten kann. Die Web-Ressourcen werden im Plguin File (*atlassian-plugin.xml*) definiert, dazu weiter unten mehr.
-- Als Link mit externer Ressource (type="url" href="www.example.com")

Da wir für das Plugin leider einige Ressourcen von Atlassian per *#requireResource()* benötigen, müssen wir mit der ersten Variante arbeiten.
Das hat aber auch den Vorteil, dass unsere Dateien direkt in JIRA gehosted werden und nicht externalisiert werden müssen. Nachteil ist natürlich,
dass man kein richtiges HTML File verwenden kann.

Ist ein Gadget über die XML definiert, so kann man es in der **atlassian-plugin.xml** mittels eines *\<gadget\>*-Tags
in das Plugin einbetten (bsp: *\<gadget key="CollectorGadget" name="VI Test Gadget for Ticket Collection" location="timeCollectorGadget.xml"/\>* ).

Startet man dann eine lokale Instanz von JIRA (**atlas-run** aus dem Folder der pom.xml heraus) sollte das Plugin sowie das
Gadget verfügbar sein. Prüfen kann man das dann in JIRA unter der Add-Ons - [http://localhost:2990/jira/plugins/servlet/upm](http://localhost:2990/jira/plugins/servlet/upm)

!ACHTUNG: Wenn dein Syntax-Fehler in einer der XMLs besteht, ist das Plugin nicht aktiviert. Im Log des Servers findet man
zuerst aber nur, dass es einen Fehler bei der Einbindung des **Test**-Packages des Plugins gab. Der eigentliche Fehler im
XML steht weiter oben beschrieben.

###Aufbau unserer Gadget.XML
Die XML befindet sich unter */src/main/resources/*. Im Folgenden beschreibe ich alle Tags und Requires von unserem Plugin.

#####ModulePref
Das **\<ModulePref\>**-Tag als solches ist der Namensgeber. Die Attribute davon tun das folgende:
- *title*: Das ist der Text, der später nach der Einbindung des Gadgets im blauen Kasten oberhalb steht
- *directory_title*: Der Name, unter dem das Plugin im "Add Gadget" - Dialog auftaucht
- *description*: Eine Beschreibung des Gedagets, die ebenfalls im "Add Gadget" - Dialog steht


#####Require & Optional
Dann haben wir diverse **\<require\>** und **\<optional\>**. Beode machen eigentlich das selbe und binden Ressourcen ein.
Sie werden aber unterschieden, da Gadgets prinzpiell dafür gedacht sind, in ALLEN Atlassian-Produkten zu laufen (also auch Confluence,
Bamboo usw.), aber nicht in jeder Umgebung alle Pakete verfügbar sind. Da wir nur mit JIRA arbeiten, kann uns das aber erstmal
egal sein.

Die Abhängikeiten sind:
- *atlassian-util* & *core*: Ich weiß nicht genau, wofür die beiden gut sind - aber ohne das Einbinden läuft das Plugin nicht.
- *setTitle*: Damit *darf* man den title (s.h. ModulePref) des Gadgets programmatisch im JS ändern
- *views*: Brauchen wir, um das Gadget konfigurierbar zu machen. Prinzipiell ermöglicht **views** einfach, dass in
ein und dem selben Gadget mehrere Subviews eingebettet werden können
- *setprefs*: Erlaubt das konfigurieren des Gadgets, bzw. genau genommen das setzen und auslesen der **\<UserPref\>**-
Attribute im XML.
- *dynamic-height*: Die höhe des Gadgets wird von JIRA angepasst. Wird benötigt, sonst meckert JIRA.
- *oatuhpopup*: Damit sich das Gadget gegenüber JIRA authentifizieren kann und wir so an die Daten des Nutzers kommen. Da
das Gadget ja aber eigentlich eh in JIRA eingebtetet wird weiß ich nicht, ob man es auch einfach weglassen kann.
- *gadget-directory*: In welchem Ordner das Gadget im "Add Gadget" - Dialog aufauchen soll.
- *#supportedLocales("gadget.common")* - Wird benötigt, um Standard-Strings anzuzeigen (z.B. "Save" für den Speicher-Button
der Konfigurationsansicht). Ist es nicht eingebunden meckert JIRA.


#####UserPref
Die **\<UserPrefs\>** sind Form-Felder, die in der Konfigurationsansicht eingebunden werden und im JS ausgelesen werden können.
Darüber hinaus sind es diese Felder, die für den User im Backend persistiert werden und dann auch nach einem Reload der
Seite / des Dashboards wieder verfügbar sind.

**isConfigured** kommt von Jira und verhindert, dass der Konfigurations-Screen automatisch angezeigt wird - natürlich erst,
wenn der User das Gadget einmalig konfiguriert hat

Alle anderen Felder dokumentiere ich hier erstmal nicht, da sie zum einen selbsterklärend sind, zum anderen vermutlich
eh ständig während der Entwicklung wechseln werden.


#####Content
Im Content werden erstmal ein par *#requireResource()* ausgeführt. Diese musste ich mir aus Hilfsforen zusammensuchen,
da sie effektiv nirgends dokumentiert, für das Plugin aber notwendig sind. Sie liefern uns zum einen das AJS-Objekt
in JavaScript, mit welchem wir das Gadget sehr leicht definieren können (inkl. der Konfigurations-Ansicht):

- *ajs-gadgets*: Bindet das JS-Framework selbst ein - also das *AJS*-Objekt
- *jira-global*: Hängt das *fields*-Objekt an *AJS.gadget*. Dieses ermöglicht uns die Nutzung von bestehenden Form-Elementen
wie dem Filter- oder dem Projekt-Picker.
- *autocomplete*: Wird vom Filter- und Projekt-Picker benötigt. Nein, das ist nirgends Dokumentiert - ist einfach so.

Das letzte Require zeigt auf unsere eigenen Ressourcen, welche wir in der *atlassian-plugin.xml* als *\<web-ressource\>*
verfügbar machen. Die Funktionsweise dort ist eigentlich selbsterklärend, daher hier nicht mehr dazu.

Das *#includeResources()* sagt JIra dann, die zuvor requireten Ressourcen auch einzubinden.

###Das AJS-Objekt
Ist als einziges relativ gut [hier](https://developer.atlassian.com/display/GADGETS/Using+the+Atlassian+Gadgets+JavaScript+Framework) dokumentiert.
Daher an dieser Stelle nicht all zu viel dazu, nur zwei Hinweise:
- **view.template** ist der Einstiegspunkt in die App, wenn sie beriets konfiguriert ist. Ansonsten ist es **config.descriptor**
- Definiert man in einem **ajaxOptions** eine andere URL als die der Gadget-Rest-API, so muss man zwingen den **contentType**
definieren - ansonsten bekommt man einen 415er (Unsupported Media Type).