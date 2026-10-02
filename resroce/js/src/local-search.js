/* 本地搜索：加载 search.xml，对标题和正文做子串匹配并高亮 */
$(function () {
	var loaded = false;
	var entries = [];

	// 仅在首次打开弹窗时加载索引
	function loadSearchData(callback) {
		if (loaded) {
			return callback();
		}
		var root = window.CONFIG && CONFIG.root ? CONFIG.root : '/';
		$.ajax({
			url: root + 'search.xml',
			dataType: 'xml',
			success: function (xml) {
				entries = $('entry', xml).map(function () {
					return {
						title: $('title', this).text(),
						url: $('url', this).text(),
						content: $('content', this).text()
					};
				}).get();
				loaded = true;
				callback();
			}
		});
	}

	function escapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function highlight(text, keyword) {
		return text.replace(new RegExp(escapeRegExp(keyword), 'gi'), '<b class="search-keyword">$&</b>');
	}

	function search(keyword) {
		var $result = $('#local-search-result');
		keyword = keyword.trim().toLowerCase();
		if (!keyword) {
			$result.empty();
			return;
		}

		var html = '';
		var count = 0;
		entries.forEach(function (item) {
			var titleIdx = item.title.toLowerCase().indexOf(keyword);
			var contentIdx = item.content.toLowerCase().indexOf(keyword);
			if (titleIdx < 0 && contentIdx < 0) {
				return;
			}
			count++;

			var titleHtml = titleIdx >= 0 ? highlight(item.title, keyword) : item.title;

			// 截取命中位置前后的正文片段
			var snippet = '';
			if (contentIdx >= 0) {
				var start = Math.max(0, contentIdx - 30);
				var end = Math.min(item.content.length, contentIdx + keyword.length + 90);
				snippet = (start > 0 ? '...' : '') +
					item.content.substring(start, end) +
					(end < item.content.length ? '...' : '');
				snippet = highlight(snippet, keyword);
			}

			html += '<p class="search-result">' +
				'<a class="search-result-title" href="' + item.url + '">' + titleHtml + '</a>' +
				(snippet ? '<br>' + snippet : '') +
				'</p>';
		});

		if (count === 0) {
			$result.html('<p id="no-result"><i class="fa fa-frown-o"></i> 没有找到相关内容</p>');
		} else {
			$result.html('<ul class="search-result-list">' + html + '</ul>');
		}
	}

	function openPopup(e) {
		e.stopPropagation();
		loadSearchData(function () {
			$('.local-search-pop-overlay').fadeIn(200);
			$('.local-search-popup').fadeIn(200);
			$('#local-search-input').focus();
		});
	}

	function closePopup() {
		$('.local-search-pop-overlay').fadeOut(200);
		$('.local-search-popup').fadeOut(200);
	}

	$('.popup-trigger').on('click', openPopup);
	$('.popup-btn-close').on('click', closePopup);
	$('.local-search-pop-overlay').on('click', closePopup);
	$(document).on('keydown', function (e) {
		if (e.key === 'Escape') {
			closePopup();
		}
	});
	$('#local-search-input').on('input', function () {
		search(this.value);
	});
});
